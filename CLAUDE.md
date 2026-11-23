# Tadween — house rules

## UI defaults
- **Tabs / segmented controls / filter rows:** always use `<Tabs>` from `src/components/Tabs.tsx`
  (frosted-glass pill track + slightly see-through white thumb that springs to the selected option, `.tabs` in `src/styles.css`).
  Mark the selected child with `className="on"`; add `className="scroll"` for a scrolling row.
  Never hand-roll a new segmented control or tab style, in existing or new pages.
- Main call to action (incl. the mic) uses the terracotta CTA (`--cta` / `--ctaInk`).
- Every UI string goes through `t()` and needs an Arabic entry in `src/lib/ar.ts`; layouts must work in RTL.
- Every design change is mirrored in the design canvas artifact (2ef1499f-4999-4861-8e70-6aeb64dc74ac).
