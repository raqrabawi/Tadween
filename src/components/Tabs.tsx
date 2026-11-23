import { useLayoutEffect, useRef, type HTMLAttributes } from 'react'

/**
 * Tadween's default tab / segmented control: a soft pill track with a white thumb that
 * springs to the selected option. Use it for EVERY tab, segment or filter row in the app,
 * including new pages. Children are the options (buttons); mark the selected one with
 * className "on". Works with equal or uneven widths, scrolling rows, and RTL.
 *
 *   <Tabs active={value} role="radiogroup" aria-label="Mode">
 *     <button className={v === 'a' ? 'on' : ''} ...>A</button>
 *   </Tabs>
 *
 * Add className="scroll" for a horizontally scrolling row (categories).
 */
export function Tabs({ active, className, children, ...rest }: { active: unknown } & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const shown = useRef<unknown>(undefined)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const thumb = el.querySelector<HTMLElement>(':scope > .tab-thumb')
    const place = () => {
      const on = el.querySelector<HTMLElement>(':scope > .on')
      if (!thumb) return
      if (!on) { thumb.style.opacity = '0'; return }
      thumb.style.opacity = '1'
      thumb.style.width = on.offsetWidth + 'px'
      thumb.style.height = on.offsetHeight + 'px'
      thumb.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`
    }
    place()
    if (shown.current !== active) {
      shown.current = active
      const on = el.querySelector<HTMLElement>(':scope > .on')
      if (on && el.scrollWidth > el.clientWidth) on.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: el.classList.contains('ready') ? 'smooth' : 'auto' })
    }
    // Only animate after the first placement, so the thumb never slides in from the edge
    const raf = requestAnimationFrame(() => el.classList.add('ready'))
    const ro = new ResizeObserver(place)
    ro.observe(el)
    Array.from(el.children).forEach((c) => ro.observe(c))
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [active, children])
  return (
    <div ref={ref} className={'tabs' + (className ? ' ' + className : '')} {...rest}>
      <span className="tab-thumb" aria-hidden="true" />
      {children}
    </div>
  )
}
