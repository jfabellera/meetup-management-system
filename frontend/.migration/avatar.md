# avatar

2026-08-01 — transformation engine (legacy style `new-york`; the wrapper was already shaped like the base registry, so this was a pure primitive rewire keeping the project's own classes). Verdict: migrated cleanly, zero consumer changes.

## Changed

- `src/components/ui/avatar.tsx` — swapped the primitive import from `radix-ui`'s `Avatar` to `@base-ui/react/avatar`, and retyped the three wrapped parts from `React.ComponentProps<typeof AvatarPrimitive.X>` to the Base UI namespace types `AvatarPrimitive.Root.Props` / `.Image.Props` / `.Fallback.Props`. Everything else preserved verbatim: the `size` prop and `data-size` variants, `resizedImageUrl` src rewriting + `resizeWidth`, the `overflow-hidden` root (the project deliberately does not use the base-lyra `after:` border ring), `text-sm` on `AvatarGroupCount`, and the custom `AvatarBadge`/`AvatarGroup`/`AvatarGroupCount` parts (plain elements, never radix). Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|IconPlaceholder" src/components/ui/avatar.tsx` → no matches.

Consumers audited — none needed edits; exports and call-site props are unchanged. None use `delayMs`, `onLoadingStatusChange`, or `asChild`:
- `src/components/Navbar/Navbar.tsx`
- `src/components/Meetups/OrganizerCombobox.tsx`
- `src/components/Meetups/OrganizerSelect.tsx`
- `src/components/shared/UserSearchInput.tsx`
- `src/pages/ProfilePage.tsx`
- `src/pages/AdminUsersPage.tsx`

Typecheck (`npx tsc --noEmit`) clean.

## Left alone

- The base-lyra registry's root border-ring (`after:...mix-blend-*`) and `bg-blend-color` on the badge were NOT adopted — the project's wrapper intentionally omits them. Kept the project's look.
- All other ui wrappers still on radix — out of scope.
- `components.json` still `"base": "radix"` / style `new-york`; flip happens after the last wrapper.

## Behavior changes

- Fallback delay prop renamed in Base UI: Radix `delayMs` → Base UI `delay`. No consumer passes it, so nothing to change, but note it for any future use.
- Base UI `Avatar.Root` renders a `div` by default (Radix rendered a `span`). No consumer depends on the tag; styling is class-driven.

## Verify by hand

1. Navbar avatar (top-right) shows the user photo; with no/broken photo it falls back to initials, both at size-8 trigger and size-24 in the menu.
2. Profile page hero avatar renders the photo at size-16/size-24 responsive.
3. Admin users list + user-search dropdown: avatars load photos and fall back to initials cleanly, no flash of empty circle.
4. Organizer select/combobox: `size="sm"` avatars render at size-6 with xs fallback text.
