# button-group

2026-08-01 — transformation engine (legacy style `new-york`; kept the project's own variant classes, rewired only the `asChild`/`Slot` in `ButtonGroupText` to Base UI `useRender`). Verdict: migrated cleanly, zero consumer changes.

## Changed

- `src/components/ui/button-group.tsx` — the sole radix dependency was `Slot` (used for `ButtonGroupText`'s `asChild`). Replaced it with `@base-ui/react/use-render` + `@base-ui/react/merge-props`; `asChild?: boolean` is gone, polymorphism now via Base UI's `render` prop (`useRender.ComponentProps<"div">`). `ButtonGroupText` had no data attributes originally, so none were added (its `mergeProps` first arg carries only `className`, so no `data-*` typing workaround was needed). `ButtonGroup` and `ButtonGroupSeparator` were already plain `<div>`/`<Separator>` compositions — untouched. All class strings and the `buttonGroupVariants` cva kept verbatim; the base-lyra restyle (`rounded-none`, `*:data-slot:*`, separator `data-horizontal:*`) was NOT adopted. Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|Slot"` → no matches. Matched this file's existing style (double quotes, no semicolons).

Consumer audited — none needed edits. Only `src/pages/OrganizerDashboard.tsx` imports button-group, and it uses `<ButtonGroup>` alone (no `ButtonGroupText`, no `asChild`).

Typecheck (`npx tsc --noEmit`) clean.

## Left alone

- `ButtonGroupSeparator` still composes the first-party `@/components/ui/separator` wrapper, which is itself still on radix. This is intentional and safe: button-group.tsx has zero radix imports after this change; separator's internals are orthogonal to button-group's `Slot` rewire. Separator should be migrated in its own pass (it's still on radix). No mixed `-base` state exists because this was an in-place edit.
- base-lyra's restyled variant classes NOT adopted — project keeps its own look.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- Public API: `ButtonGroupText`'s `asChild` prop removed in favor of Base UI's `render` prop. No consumer used it, so nothing broke; future polymorphic use must pass `render={<… />}`.

## Verify by hand

1. OrganizerDashboard: the button group renders its buttons flush with shared borders (first/last rounded, middle corners squared, no doubled borders between items).
2. Focus a middle button — it should raise above neighbors (`focus-visible:relative z-10`) so its focus ring isn't clipped.
