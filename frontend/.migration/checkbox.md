# checkbox

2026-08-01 — transformation engine (legacy style `new-york`; primitive rewire + data-attribute selector remap, kept the project's own classes and lucide icon). Verdict: migrated cleanly, zero consumer changes.

## Changed

- `src/components/ui/checkbox.tsx` — swapped `radix-ui` `Checkbox` for `@base-ui/react/checkbox`; type `React.ComponentProps<typeof CheckboxPrimitive.Root>` → `CheckboxPrimitive.Root.Props`. Rewrote the state selectors in the Root className from Radix's `data-[state=checked]:` to Base UI's presence attribute `data-checked:` (4 tokens: `border-primary`, `bg-primary`, `text-primary-foreground`, and `dark:…bg-primary`). Every other class kept verbatim, and the lucide `CheckIcon` was kept (the base registry's `IconPlaceholder` was NOT adopted). The remap is corroborated by both the skill's `class-mapping.md` and the base-lyra variant, which uses the same `data-checked:*` classes. Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state="` → no matches.

Consumers audited — none needed edits. All 9 pass a boolean `checked` and (where interactive) `onCheckedChange={(checked) => …}` using `checked` as a boolean. Base UI's `onCheckedChange(checked: boolean, eventDetails)` is first-arg-compatible, and no consumer uses Radix's `'indeterminate'` checked value (which Base UI splits into a separate `indeterminate` prop). The display-only checkboxes in `DataTable.tsx` / `MeetupTagFilter.tsx` (`checked` + `tabIndex={-1}`, no handler) stay controlled read-only, same as before.
- Consumers: `DataTable.tsx`, `Meetups/MeetupDiscordCard.tsx`, `Meetups/MeetupTagFilter.tsx`, `Meetups/MeetupDetailsSettingsCard.tsx`, `pages/RegisterPage.tsx`, `pages/NewMeetupFromEventbritePage.tsx`, `pages/NewMeetupPage.tsx`, `pages/NewArchiveMeetupPage.tsx`, `pages/AccountPage.tsx`

Typecheck (`npx tsc --noEmit`) clean.

## Left alone

- base-lyra restyle (`rounded-none`, `after:` hit-area, Field-integration classes, `IconPlaceholder`) NOT adopted — project keeps its own look and lucide icon.
- All other ui wrappers still on radix — out of scope.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- Element change: Radix Checkbox.Root rendered a `<button>`; Base UI renders a `<span>` (role=checkbox) plus a hidden `<input>`. Passed HTML props (`tabIndex`, `id`) still apply. No consumer depends on the tag.
- `onCheckedChange` now fires `(checked: boolean, eventDetails)` instead of `(checked: boolean | 'indeterminate')`. All handlers already treated the value as boolean, so behavior is unchanged; the value is now cleanly typed.

## Verify by hand

1. Toggling a checkbox (e.g. RegisterPage "request organizer", NewMeetupPage "unlisted"/"paid"/"raffle") flips it, and the CHECKED state shows the primary-colored fill + check icon — confirms the `data-[state=checked]` → `data-checked` remap actually styles the checked state.
2. Keyboard: focus a checkbox and press Space to toggle; focus ring appears (`focus-visible:ring-[3px]`).
3. DataTable / MeetupTagFilter row checkboxes render checked/unchecked to reflect selection and are not tab-focusable (`tabIndex={-1}`); row selection still works.
4. A disabled/invalid checkbox (if any form shows one) still dims and shows the destructive ring.
