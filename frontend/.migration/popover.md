# popover

2026-08-02 — transformation engine (legacy style `new-york`; Content→Portal>Positioner>Popup split + data-attr/CSS-var remap). Verdict: migrated; 2 consumer files updated (3 `asChild` → `render`); full build green. Same overlay family + animation classes as the already in-browser-verified dropdown-menu.

## Changed

- `src/components/ui/popover.tsx` — swapped `radix-ui` `Popover` for `@base-ui/react/popover`.
  - **Content restructured** `Portal > Content` → `Portal > Positioner > Popup` (mirrors the dropdown-menu migration exactly). Positioning props (`align`, `alignOffset`, `side`, `sideOffset`) moved to `Positioner`; the visual/animation classes stay on `Popup` (`data-slot="popover-content"` kept). Positioner gets `className="isolate z-50"`.
  - **Data-attr remap** in the className: `data-[state=open]`→`data-open`, `data-[state=closed]`→`data-closed`. `data-[side=*]` selectors are unchanged (Base UI also exposes `data-side`).
  - **CSS var remap**: `origin-(--radix-popover-content-transform-origin)`→`origin-(--transform-origin)`.
  - **`onOpenAutoFocus` → Popup `initialFocus`.** The project suppressed auto-focus on touch (no on-screen keyboard pop). Radix `onOpenAutoFocus={(e)=>isTouchDevice() && e.preventDefault()}` became `initialFocus={initialFocus ?? (() => !isTouchDevice())}` — Base UI's `initialFocus` fn returns `false` to skip focus (touch) / `true` for default focus (desktop). Callers can still override via `initialFocus`. Same shape as the dialog migration.
  - Types moved to `.Props`: `Root.Props`, `Trigger.Props`, and `PopoverContent` = `Popup.Props & Pick<Positioner.Props, 'align'|'alignOffset'|'side'|'sideOffset'>`.
  - Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state=\|--radix-popover"` on popover.tsx and both consumers → none.

- `src/components/DataTable.tsx` — `SortPopover` + `FilterPopover`: 2 `PopoverTrigger asChild` → `render={<Button … />}` (children moved to the trigger). `onOpenChange={setOpen}` one-arg handlers are unaffected by the widened `(open, eventDetails)` signature.
- `src/components/Meetups/MeetupTagFilter.tsx` — 1 `PopoverTrigger asChild` → `render={<Button … />}`.

## Left alone

- **`PopoverAnchor`** — Base UI has no Anchor part (anchoring is the Positioner `anchor` prop). No consumer imports it, so the export is kept as an **inert passthrough** (`return <>{children}</>`) for API stability, and flagged here. If a future caller needs anchoring, wire an `anchor` ref through to `Positioner` instead of using this component.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- `onOpenChange` now receives `(open, eventDetails)`; both existing consumers pass one-arg `setOpen`, unaffected.
- `initialFocus` replaces `onOpenAutoFocus`. Desktop still auto-focuses; touch still suppresses focus. The exact element focused by default may differ slightly from Radix's first-focusable heuristic.
- `PopoverAnchor` is now inert (renders children only, drops the wrapper element). No consumer uses it.

## Verify by hand

1. DataTable (Admin Users/Groups pages): click the Sort and Filter buttons — popover opens aligned to the trigger's end, closes on outside-click and Escape, and reopens. No flash/lingering dim on close.
2. MeetupTagFilter: open the tag filter popover, toggle tags, close — selection persists and the count badge updates.
3. Mobile/touch: open a popover — the on-screen keyboard must NOT pop (initialFocus suppressed on touch); on desktop focus still moves into the popup.
