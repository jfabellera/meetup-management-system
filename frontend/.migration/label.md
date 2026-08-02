# label

2026-08-02 — transformation engine (legacy style `new-york`; Label has no Base UI counterpart → native `<label>`). Verdict: migrated; wrapper-only swap, zero consumer changes; full build green.

## Changed

- `src/components/ui/label.tsx` — dropped `radix-ui` `Label` primitive and rendered a native `<label>` instead. `React.ComponentProps<typeof LabelPrimitive.Root>` → `React.ComponentProps<'label'>`. Kept `data-slot="label"` and every visual class verbatim. Radix `Label.Root`'s only real behaviors were (a) forwarding focus to the associated control on click — a native `<label htmlFor>` does this for free — and (b) suppressing text selection on double-click, already covered by the existing `select-none` class. Leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/label.tsx` → none.

No consumer changes: no call site used `asChild` (the only Label prop without a native equivalent), and `field.tsx`'s `FieldLabel` types off `React.ComponentProps<typeof Label>`, which now resolves to the `<label>` props — still valid.

Consumers (unchanged, verified by typecheck): `ui/field.tsx`, `Meetups/MeetupDetailsSettingsCard.tsx`, `pages/RegisterPage.tsx`, `DiscordLinkPage.tsx`, `RafflePage.tsx`, `ManageMeetupDisplayPage.tsx`, `NewMeetupFromEventbritePage.tsx`, `NewMeetupPage.tsx`, `NewArchiveMeetupPage.tsx`, `AdminGroupsPage.tsx`, `AccountPage.tsx`.

Full `npm run build` succeeds.

## Left alone

- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- None expected. Radix `Label.Root` and a native `<label htmlFor>` behave identically for click-to-focus. The double-click select suppression is preserved via `select-none`.

## Verify by hand

1. On any form (RegisterPage, NewMeetupPage, AccountPage), click a field's label text — focus should move into its associated input/control.
2. Double-click a label — the text should not become selected (select-none).
3. Disabled field group: label should dim (`group-data-[disabled=true]:opacity-50`) and not be clickable.
