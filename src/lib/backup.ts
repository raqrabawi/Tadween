import { migrateGuest, saveGuest, type GuestData } from './guest'

/** Ask the browser to keep Tadween's data even when the device runs low on space (no prompt on most browsers). */
export async function keepDataPermanently() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch { /* not supported */ }
}

type Snapshot = Omit<GuestData, 'profile'> & { profile: GuestData['profile'] }
export type Backup = { app: 'tadween'; version: 1; exported_at: string; data: Snapshot }

export function makeBackup(data: Snapshot): Backup {
  return { app: 'tadween', version: 1, exported_at: new Date().toISOString(), data }
}

/** Saves a .json file (shares it on phones that support sharing files). */
export async function downloadBackup(b: Backup) {
  const name = `tadween-backup-${b.exported_at.slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' })
  const file = new File([blob], name, { type: 'application/json' })
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean }
  if (nav.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], title: name }); return } catch { /* cancelled: fall back to download */ }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

export function readBackup(text: string): Snapshot | null {
  try {
    const j = JSON.parse(text) as Partial<Backup>
    const d = j?.app === 'tadween' ? j.data : null
    if (!d || !Array.isArray(d.lists) || !Array.isArray(d.items) || !Array.isArray(d.events) || !Array.isArray(d.reminders) || !Array.isArray(d.notes) || !Array.isArray(d.categories)) return null
    return d as Snapshot
  } catch { return null }
}

/**
 * Restore. On this phone (guest) the backup replaces what's here.
 * When signed in, it is added to the account (lists and categories with the same name are merged).
 */
export async function restoreBackup(d: Snapshot, signedIn: boolean, familyId: string | null): Promise<boolean> {
  saveGuest(d as GuestData)
  if (!signedIn) return true
  return migrateGuest(familyId)
}
