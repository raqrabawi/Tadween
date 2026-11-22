/** Opens the camera or photo library and returns a resized JPEG as a data URL (or null if cancelled). */
export function pickPhoto(source: 'camera' | 'gallery'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (source === 'camera') input.setAttribute('capture', 'environment')
    input.style.display = 'none'
    document.body.appendChild(input)
    input.onchange = async () => {
      const file = input.files?.[0]
      input.remove()
      resolve(file ? await shrink(file) : null)
    }
    input.addEventListener('cancel', () => { input.remove(); resolve(null) })
    input.click()
  })
}

// Keeps photos small enough to store with the note (about 100–250 KB)
async function shrink(file: File, max = 1280, quality = 0.8): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url })
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', quality)
  } finally { URL.revokeObjectURL(url) }
}
