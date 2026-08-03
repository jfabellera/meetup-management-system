# select

2026-08-02 — transformation engine (legacy style `new-york`; Content split into Portal>Positioner>Popup>List + renamed parts, plus per-consumer value→label wiring). Verdict: migrated; 7 consumer files updated; typecheck + full build green; verified in a real browser (headless CDP): label mapping, positioning, highlight, focus ring, clean close, scroll arrows.

## Changed

- `src/components/ui/select.tsx` — swapped `radix-ui` `Select` for `@base-ui/react/select`.
  - **Root narrows `onValueChange` to `string`.** Base UI's single-select value is `string | null` (null = no selection); no select in this app is clearable, so `Select` is a thin wrapper over `SelectPrimitive.Root<string>` that re-types `onValueChange` to `(value: string) => void` and drops the null case. The generic must be pinned with JSX `<SelectPrimitive.Root<string>>` or inference collapses to `unknown` and rejects the string-typed spread. The old inert `data-slot="select"` (Root renders no DOM node) is dropped. See [[base-ui-migration-decisions]] which pre-recorded this narrowing decision.
  - **Content → Portal > Positioner > Popup.** Positioning moved to Positioner; `Viewport` → `List` (wraps items, keeps `p-1`); scroll buttons moved INSIDE the Popup. Positioner gets `isolate z-50`; Popup keeps `relative isolate z-50` (relative is required — Base UI scroll arrows are `position: absolute`).
  - **`position` prop dropped; `alignItemWithTrigger` (default `true`) exposed.** Radix `position="item-aligned"` (the wrapper default) = Base UI `alignItemWithTrigger` (default true); `"popper"` = `false`. The popper-only translate classes were removed with it. `sideOffset` default 4.
  - **Renamed parts:** `Label` → `GroupLabel` (Base UI's `Select.Label` is a NEW trigger-label part — do NOT use it here); `ScrollUpButton`/`ScrollDownButton` → `ScrollUpArrow`/`ScrollDownArrow` (kept the old export names + `data-slot`s; added `top-0`/`bottom-0 w-full bg-popover z-10` so the absolutely-positioned arrows overlay the list edges); `Icon asChild` → `render`.
  - **Data-attr / CSS-var remap:** `data-[state=open/closed]` → `data-open`/`data-closed`; item `data-[disabled]` → `data-disabled`. CSS vars now resolve off the Positioner and inherit down: `--radix-select-content-available-height` → `--available-height`, `--radix-select-content-transform-origin` → `--transform-origin`. Item `focus:bg-accent` kept verbatim — Base UI roving-focuses the highlighted item (matches the base registry, which also uses `focus:`).
  - Types moved to `.Props`. Leftover scan clean on the wrapper and all consumers: `grep -n "radix-ui\|@radix-ui\|data-\[state=\|--radix-select"` → none.

**Consumer value→label wiring (the one non-mechanical part).** Base UI's `Select.Value` renders the RAW value string unless Root gets an `items` map or Value gets a `children` fn (verified against `@base-ui/react@1.6.0` source: `resolveSelectedLabel(value, items, itemToStringLabel)`). Every select here has label ≠ value, so each needed one of:
- `items` on Root (Record or `{value,label}[]`) — used everywhere the label is a plain string:
  - `Meetups/MeetupDiscordCard.tsx` — server + channel selects (`items` from the fetched arrays; channel label keeps the `#` prefix).
  - `Meetups/MeetupDetailsSettingsCard.tsx`, `Meetups/MeetupGallery.tsx`, `pages/NewArchiveMeetupPage.tsx` — static `{ me, other }` records.
  - `pages/NewMeetupFromEventbritePage.tsx` — `items` from `options`.
  - `pages/AdminGroupsPage.tsx` — `items` array mirroring the item list (None sentinel + servers + the conditional "Unknown server" fallback).
- `children` fn on `Value` — `Meetups/OrganizerSelect.tsx` only, because its selected display is rich (avatar + name, not a plain string). The fn looks the organizer up by id and renders the same avatar+name, preserving the exact Radix trigger content.

## Left alone

- base-lyra restyle (cn-* hooks, `w-(--anchor-width)`, `rounded-none`, `ring`, `data-[align-trigger=true]:animate-none`) NOT adopted — kept the project's `new-york` classes. Note the `data-[align-trigger=true]` attribute does not exist in Base UI 1.6.0 anyway (newer registry).
- `SelectSeparator` / `SelectLabel` (GroupLabel) exports kept though no consumer uses them.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- **Closed popup stays mounted, collapsed.** Base UI keeps `[data-slot=select-content]` in the DOM when closed as a `0×0`, `pointer-events:none`, `data-closed` element (confirmed it does NOT block clicks — `elementFromPoint` at its old center returns the page). This is normal Base UI Select behavior, not a leak or a stuck overlay; do not "fix" it. It is unrelated to the dialog close-flash (there is no backdrop here). See [[base-ui-overlay-close-flash]].
- `onValueChange` fires `(value, eventDetails)`; the wrapper hides the second arg and the `null` case from callers.
- Item-aligned positioning is Base UI's, not Radix's — the popup overlays the trigger with the selected item aligned; visually equivalent, pixel positions may differ slightly.
- Scroll arrows only render when the list overflows and not on touch input (Base UI behavior); Radix showed them similarly.

## Verify by hand

1. New Archive Meetup (`/new-meetup/archive`) or Edit meetup details: open the "Who organized this" select — picking "Someone else organized this" must show that LABEL in the trigger (not the raw `other`), and the name field appears.
2. Discord card: server select populates channels; both show names (channel with `#`). Switching server clears the channel.
3. OrganizerSelect (assign organizer): the trigger shows the selected organizer's avatar + name (not just an id).
4. Admin Groups → edit group → Discord server: "None", each server, and any stale "Unknown server (…)" all select and display correctly.
5. A long list (many servers): scroll — the down/up chevrons appear at the popup edges and scroll the list; they vanish on touch.
6. Keyboard: open with Enter/Space, type-ahead jumps to matching option, arrows move highlight, Enter selects, Escape closes.
