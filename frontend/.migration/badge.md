# badge

2026-08-01 — transformation engine (legacy style `new-york`; kept the project's own `badgeVariants` classes, only rewired the `asChild`/`Slot` mechanism to Base UI `useRender`). Verdict: migrated cleanly, zero consumer changes.

## Changed

- `src/components/ui/badge.tsx` — replaced radix `Slot`-based `asChild` with Base UI's `useRender` + `mergeProps`. Import swapped from `radix-ui` `Slot` to `@base-ui/react/use-render` and `@base-ui/react/merge-props`. The `asChild?: boolean` prop is gone; polymorphism is now via the Base UI `render` prop (`useRender.ComponentProps<'span'>`). `data-slot="badge"` / `data-variant` are set explicitly on the outer props object (per the project's useRender decision) rather than via `state` mapping — `useRender`'s `props` is typed `Record<string, unknown>`, so the `data-*` keys type-check there, whereas `mergeProps`'s typed span literal rejects them. `badgeVariants` (all class strings and variants: default/secondary/destructive/outline/ghost/link, `rounded-full`, `[a&]:hover:*`) is unchanged — the base-lyra restyle was deliberately NOT adopted. Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|Slot"` → no matches.

Consumers audited — none needed edits. No consumer passes `asChild` (or `render`) to `<Badge>`; the `asChild` occurrences near Badge are on the wrapping `TooltipTrigger`, which clones its child span and is unaffected. Consumers:
- `src/components/AttendeeDetailsDialog.tsx`, `src/components/Meetups/MeetupDiscordCard.tsx`, `src/components/Navbar/Navbar.tsx`, `src/components/Meetups/TagBadge.tsx`, `src/components/Meetups/MeetupDetailsSettingsCard.tsx`, `src/components/Meetups/MeetupModal.tsx`, `src/components/Meetups/MeetupOrganizerCard.tsx`, `src/components/RafflePage/RaffleHistoryCard.tsx`, `src/components/Account/GroupsCard.tsx`, `src/pages/ProfilePage.tsx`, `src/pages/AdminUsersPage.tsx`, `src/pages/ManageMeetupAttendeesPage.tsx`, `src/pages/AccountPage.tsx`

Typecheck (`npx tsc --noEmit`) clean.

## Left alone

- base-lyra's restyled variants (`h-5`, `rounded-none`, `has-data-[icon=*]` padding, different colors) NOT adopted — project keeps its own look.
- All other ui wrappers still on radix — out of scope.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- Public API: `asChild` prop removed in favor of Base UI's `render` prop. No consumer used `asChild`, so nothing broke, but any future polymorphic use must pass `render={<a … />}` instead of `asChild`. The `[a&]:hover:*` classes still apply when rendered as an anchor via `render`.

## Verify by hand

1. Badges render with correct variant colors across the app (tags on meetup cards, "Archived"/"Unlisted" badges in the meetup modal, the "Legacy" badge on the account page).
2. Tooltip-wrapped badges (MeetupModal Archived/Unlisted, AccountPage Legacy) still show their tooltip on hover — confirms the TooltipTrigger→span ref/prop forwarding survived.
3. A badge containing an icon + text still lays out with the gap and `size-3` icon sizing.
