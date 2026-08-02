# dialog

2026-08-01 — transformation engine (legacy style `new-york`; overlay restructure + data-attr remap, kept the project's own classes and lucide icon). Verdict: migrated; 7 consumer files updated (16 `asChild` → `render`, plus MeetupModal's outside-press hack); full build green. Runtime QA recommended (focus + outside-press + double-overlay).

## Changed

- `src/components/ui/dialog.tsx` — swapped `radix-ui` `Dialog` for `@base-ui/react/dialog`. Part renames per the overlay reference: `Overlay` → `Backdrop` (kept the `DialogOverlay` export name and `data-slot="dialog-overlay"`), `Content` → `Popup` (centered modal, NO Positioner — matches the base-lyra variant, keeps the project's `fixed top-[50%] left-[50%] translate-*` centering). All `data-[state=open]` / `data-[state=closed]` selectors in the overlay, content, and close-button classNames rewritten to `data-open:` / `data-closed:`. Types moved to `.Props` (`Root.Props`, `Backdrop.Props`, `Popup.Props`, etc.). Every visual class kept verbatim; the base-lyra restyle and `IconPlaceholder` were NOT adopted (kept lucide `XIcon`). `DialogFooter`'s built-in close button: `<Close asChild><Button/></Close>` → `<Close render={<Button variant="outline" />}>Close</Close>`. Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state="` → none.
  - **Custom `onOpenAutoFocus` → Popup `initialFocus`.** The project suppresses auto-focus on touch devices so the on-screen keyboard doesn't pop. Radix `onOpenAutoFocus={(e) => isTouchDevice() && e.preventDefault()}` became `initialFocus={initialFocus ?? (() => !isTouchDevice())}` — Base UI's `initialFocus` function returns `false` to skip focus (touch) or `true` for default focus (desktop). Callers can still override by passing `initialFocus`.

Consumers updated (16 `asChild` → `render`, mechanical rule: move the inner element into `render={<X … />}` and its children become the wrapper's children — mirrors the base-lyra Close pattern):
- `Meetups/MeetupDiscordCard.tsx` — 1 Trigger, 1 Close.
- `Meetups/DangerZoneCard.tsx` — 2 Trigger, 2 Close.
- `Meetups/GalleryActions.tsx` — 3 Close.
- `Meetups/MeetupRsvpForm.tsx` — 1 Close.
- `Meetups/MeetupGallery.tsx` — 1 Trigger (wraps a native `<button>`), 1 Close.
- `RafflePage/RaffleHistoryCard.tsx` — 1 Trigger (with `onClick` stopPropagation), 2 Close (one with dynamic children + `disabled`/`onClick`).
- `Meetups/MeetupModal.tsx` — 1 Close, PLUS the outside-press hack conversion below.

**MeetupModal outside-press hack.** Radix `DialogContent onInteractOutside={(e) => { if (querySelector('[data-radix-popper-content-wrapper]')) e.preventDefault(); }}` moved to Root `onOpenChange(open, eventDetails)`: when closing, if `eventDetails.reason === 'outside-press'` and a Radix popper (the still-Radix dropdown-menu) is open, call `eventDetails.cancel()` to keep the modal open. The selector is still the Radix one **on purpose** — dropdown-menu has not been migrated yet.

Consumers NOT needing changes (Dialog imported, but `asChild` only on Tooltip/DropdownMenu, or fully controlled): `AttendeeDetailsDialog.tsx`, `Meetups/TagCombobox.tsx`, `Account/GroupsCard.tsx`, `pages/CheckInPage.tsx`, `pages/AdminUsersPage.tsx`, `pages/AdminGroupsPage.tsx`, `pages/AccountPage.tsx`.

Typecheck clean; full `npm run build` succeeds (1529 modules).

## Close-flash fix (follow-up, verified in-browser)

Reported symptom: closing any dialog flashed the screen. Root-caused by driving the real dialog headless (Chrome CDP) and sampling opacity per frame during close:
- Base UI keeps the backdrop mounted until the whole dialog finishes closing (gated by the content's longer exit), but tw-animate-css `animate-out` uses `animation-fill-mode: none`. So the backdrop's 150ms fade completed, then **reverted to opacity 1** (full dim) and sat there ~200ms until unmount — the flash. Radix never showed this because it unmounted each element at its own `animationend`.
  - Fix: `data-closed:fill-mode-forwards` on `DialogOverlay` so the exit holds opacity 0 until unmount. Verified: backdrop now fades 1→0 monotonically and holds at 0 (no snap-back).
- MeetupModal had a SECOND backdrop (sibling `<DialogOverlay className="backdrop-blur-xs">` plus the one inside `DialogContent`). Two Base UI `Dialog.Backdrop`s don't transition together — the blur one stuck at opacity 1 for ~400ms after content unmounted (screen stayed blurred).
  - Fix: added an `overlayClassName` prop to `DialogContent` (forwarded to its single internal `DialogOverlay`); MeetupModal now passes `overlayClassName="backdrop-blur-xs"` and no longer renders its own backdrop. Verified: one backdrop, fades and unmounts with the content (~250ms), clean.

Files: `src/components/ui/dialog.tsx` (fill-mode-forwards + `overlayClassName`), `src/components/Meetups/MeetupModal.tsx` (drop sibling backdrop, use `overlayClassName`). Typecheck + build green.

Note for future overlay migrations (sheet, popover, dropdown-menu, select, tooltip): any lingering animated-out element that outlives its own animation needs `data-closed:fill-mode-forwards`, and never render two Base UI backdrops in one overlay.

## Left alone

- base-lyra restyle (`rounded-none`, `ring-1 ring-foreground/10`, `bg-popover`, `IconPlaceholder`, blur backdrop defaults) NOT adopted.
- MeetupModal keeps its intentional TWO backdrops: `DialogContent` renders the internal `bg-black/50` overlay AND MeetupModal adds a sibling `<DialogOverlay className="backdrop-blur-xs" />` — same as before the migration.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- Overlay→Backdrop and Content→Popup: enter/exit animations now key off `data-open`/`data-closed` presence attributes instead of `data-[state]`. Visuals identical if the classes were remapped correctly (they were).
- `onOpenChange` now receives `(open, eventDetails)`. Existing one-arg handlers are unaffected; MeetupModal uses the second arg deliberately.
- `initialFocus` replaces `onOpenAutoFocus`. Desktop still auto-focuses; touch still suppresses focus. The exact element focused by default may differ slightly from Radix's first-focusable heuristic.
- MUST REVISIT when dropdown-menu migrates: the MeetupModal hack's `[data-radix-popper-content-wrapper]` selector will stop matching once the dropdown is Base UI; switch it to `[data-slot=dropdown-menu-content]` (as the migration decision memo notes).

## Verify by hand

1. Open any confirmation dialog (DangerZoneCard delete/transfer, RaffleHistoryCard delete, Discord delete): trigger opens it, Cancel/Close buttons close it, Escape closes it, clicking the backdrop closes it.
2. MeetupModal: open a meetup, then open a dropdown menu inside it and click a dropdown item — the MODAL must stay open (outside-press hack). Close the modal via the X and via backdrop click.
3. MeetupModal backdrop: confirm the blur + dim still render (two stacked backdrops).
4. Mobile/touch: open a dialog that contains a text input (e.g. gallery add, transfer meetup) — the on-screen keyboard should NOT auto-pop on open; on desktop the first field still focuses.
5. RaffleHistoryCard delete button: while the cooldown counter is >0 the destructive button is disabled and does not close/delete; after cooldown it deletes and closes.
