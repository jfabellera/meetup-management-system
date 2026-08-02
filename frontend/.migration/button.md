# button

2026-08-01 — transformation engine (legacy style `new-york`; deliberately `useRender`, NOT Base UI `ButtonPrimitive`). Verdict: migrated cleanly; 3 consumer call sites updated; full build green.

## Changed

- `src/components/ui/button.tsx` — replaced radix `Slot`/`asChild` with `@base-ui/react/use-render` + `@base-ui/react/merge-props`. Per the project's standing decision, this uses `useRender` rather than `@base-ui/react/button`'s `ButtonPrimitive`: `ButtonPrimitive` injects `role="button"` + keyboard handlers onto rendered links (a11y regression vs Slot), whereas `useRender` gives exact Slot parity. The `asChild?: boolean` prop is gone; polymorphism is via Base UI's `render` prop (`useRender.ComponentProps<'button'>`). `data-slot`/`data-variant`/`data-size` are set explicitly in `useRender`'s outer `props` object (which is typed `Record<string, unknown>`, so `data-*` type-checks there — `mergeProps`'s typed span/button literal rejects `data-*`). `buttonVariants` cva and every class string kept verbatim (the base-lyra restyle — `rounded-none`, `h-8`, `has-data-[icon=*]` — was NOT adopted). Note the preserved `cn(buttonVariants({ variant, size, className }))`: cva folds `className` in itself. Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|Slot"` on button.tsx → no matches.

Consumers updated (only those passing `asChild` TO Button; the far more common `<SomeTrigger asChild><Button/></SomeTrigger>` pattern is the trigger's concern and needed no change):
- `src/components/Meetups/MeetupDiscordCard.tsx:187` — `<Button asChild><a…>` → `<Button render={<a… />}>label</Button>`.
- `src/components/Meetups/MeetupEventbriteCard.tsx:44` — same conversion.
- `src/components/ui/combobox.tsx:74` — passed `asChild` indirectly via `InputGroupButton` (whose props are `Omit<ComponentProps<typeof Button>, "size">`, so it re-exposed Button's `asChild`). Converted `asChild` + `<ComboboxTrigger/>` child to `render={<ComboboxTrigger />}`. tsc surfaced this indirect passthrough after `asChild` left Button's type.

Typecheck clean; full `npm run build` (tsc + vite) succeeds — 1529 modules, no errors (pre-existing >500 kB chunk-size warning only).

## Left alone

- ~48 other Button consumers unchanged — they either render a plain button or wrap Button in a trigger's `asChild`, neither of which touches Button's own API.
- base-lyra restyle NOT adopted; project keeps its own look.
- `components.json` still `"base": "radix"` / style `new-york`; flip after the last wrapper.

## Behavior changes

- Public API: Button's `asChild` prop removed in favor of Base UI's `render` prop. All in-repo call sites updated; any future polymorphic button must use `render={<a … />}` / `render={<Link … />}`.
- Ref forwarding: the old plain-function Button silently dropped injected refs; `useRender` + `mergeProps` now forwards them. A net improvement, but any code that relied on the ref being ignored would now receive it (none found).

## Verify by hand

1. The two external-link buttons render as anchors: MeetupDiscordCard "View in Discord" and MeetupEventbriteCard "View on Eventbrite" — click opens in a new tab, and they still look like secondary buttons.
2. Combobox trigger button (chevron) still opens the popover and the clear button still shows/hides via the `group-has-data-[slot=combobox-clear]` rule.
3. A sampling of normal buttons across sizes/variants (primary submit, ghost icon buttons in toolbars, destructive) render with correct sizing and `data-variant`/`data-size` attributes.
4. Buttons inside DropdownMenuTrigger/TooltipTrigger/DialogTrigger `asChild` still trigger their overlays (ref/prop forwarding through the trigger).
