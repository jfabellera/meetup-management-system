# dropdown-menu

2026-08-02 — transformation engine (legacy style `new-york`; Radix `DropdownMenu` → Base UI `Menu`, kept the project's classes + lucide icons). Verdict: migrated; 4 consumers + MeetupModal updated; build green; interaction verified in-browser.

## Changed

- `src/components/ui/dropdown-menu.tsx` — swapped `radix-ui` `DropdownMenu` for `@base-ui/react/menu` (`Menu`). Part map: Content → `Portal > Positioner > Popup` (align/side/sideOffset/alignOffset moved to Positioner); Label → `GroupLabel`; Sub → `SubmenuRoot`; SubTrigger → `SubmenuTrigger`; checkbox/radio `ItemIndicator` → `CheckboxItemIndicator`/`RadioItemIndicator`. Data-attr + CSS-var remaps in the classNames: `data-[state=open]:`→`data-open:`, `data-[state=closed]:`→`data-closed:`, SubTrigger open marker `data-[state=open]:`→`data-popup-open:`, `--radix-dropdown-menu-content-available-height`→`--available-height`, `--radix-dropdown-menu-content-transform-origin`→`--transform-origin`, `data-[disabled]:`→`data-disabled:`. Kept all visual classes and lucide `CheckIcon`/`ChevronRightIcon`/`CircleIcon` (base registry `IconPlaceholder` NOT adopted; `min-w-[8rem]` kept rather than base's `w-(--anchor-width)`). Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state=\|--radix-"` → none.
  - **`suppressNextInteraction` moved to Root `onOpenChange`.** It was on Content's `onPointerDownOutside` (dropped in Base UI). Now `DropdownMenu` (Menu.Root) hooks `onOpenChange(open, eventDetails)` and calls `suppressNextInteraction()` when `!open && eventDetails.reason === 'outside-press'`, then forwards the consumer's `onOpenChange`.

Consumers updated:
- `Navbar/Navbar.tsx`, `pages/OrganizerDashboard.tsx`, `Meetups/AddToCalendarButton.tsx`, `Meetups/GalleryActions.tsx` — `DropdownMenuTrigger asChild` → `render` (4 sites).
- `Meetups/AddToCalendarButton.tsx` — 3× `DropdownMenuItem asChild` wrapping `<a>` → `render={<a … />}` (calendar links).
- `Meetups/GalleryActions.tsx` — 6× `DropdownMenuItem onSelect` → `onClick`. The three that called `event.preventDefault()` to keep the menu open (Edit/Transfer/Delete, which open a dialog) now use `closeOnClick={false}` + `onClick` (Base UI's replacement for the keep-open pattern).
- `Meetups/MeetupModal.tsx` — the Dialog outside-press hack's selector switched from the Radix `[data-radix-popper-content-wrapper]` to `[data-slot=dropdown-menu-content]` (the Base UI menu popup). This is the coupling flagged in the dialog migration; now resolved.

Typecheck + full `npm run build` (1612 modules) green.

## Verify (done in-browser, headless Chrome)

- Opened a meetup modal → the `AddToCalendarButton` dropdown opens with `data-slot=dropdown-menu-content`, positions on `side=bottom`, renders the three items, styled as a bordered popover.
- Escape closes the dropdown only; the modal stays open.
- **Outside-press hack:** with the dropdown open, a real click outside it closes the dropdown and KEEPS the modal open; a second outside click (no dropdown) then closes the modal. Confirms both `eventDetails.cancel()` in MeetupModal and the new selector.

## Left alone

- Checkbox/Radio/Sub menu parts are migrated and exported but NO consumer uses them — untested at runtime.
- base-lyra restyle (`rounded-none`, translucent menu classes, `IconPlaceholder`, `w-(--anchor-width)`) NOT adopted.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- Base UI `CheckboxItem`/`RadioItem` default `closeOnClick: false` (Radix closed on select). No consumer uses these, so nothing changes today; if adopted, set `closeOnClick` explicitly to restore Radix's close-on-select.
- `DropdownMenuItem` `onSelect(event)` (with `event.preventDefault()` to keep open) is replaced by `onClick` + `closeOnClick={false}`. GalleryActions' Edit/Transfer/Delete keep the menu open exactly as before.
- Menu default `modal: true` (same as Radix). No visible backdrop, so the overlay close-flash issue (fill-mode-forwards) does not apply here — the popup unmounts at its own animation end.

## Verify by hand

1. Navbar account menu (logged in): opens on avatar click, items navigate and the menu closes; the pending-request badge shows without opening the menu.
2. OrganizerDashboard "More options": opens, "Add archive meetup" navigates.
3. GalleryActions "⋮" menu: Open meetup / View profile / Copy URL close the menu and act; Edit / Transfer / Delete keep the menu context and open their dialog.
4. AddToCalendarButton inside a meetup modal: the three calendar links open in a new tab; clicking outside the dropdown keeps the modal open (only the dropdown closes).
