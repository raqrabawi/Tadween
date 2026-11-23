import { useRef } from 'react'
import { haptic } from './a11y'

/** Long press (or right-click) opens an item's quick actions; a normal tap still works. */
export function useLongPress(onLong: () => void, ms = 480) {
  const timer = useRef<number | undefined>(undefined)
  const fired = useRef(false)
  const at = useRef({ x: 0, y: 0 })
  const clear = () => { window.clearTimeout(timer.current) }
  return {
    fired,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        fired.current = false; at.current = { x: e.clientX, y: e.clientY }
        timer.current = window.setTimeout(() => { fired.current = true; haptic(15); onLong() }, ms)
      },
      onPointerMove: (e: React.PointerEvent) => { if (Math.hypot(e.clientX - at.current.x, e.clientY - at.current.y) > 10) clear() },
      onPointerUp: clear, onPointerLeave: clear, onPointerCancel: clear,
      onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); clear(); fired.current = true; onLong() }
    }
  }
}
