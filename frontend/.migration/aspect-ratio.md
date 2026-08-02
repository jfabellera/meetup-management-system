# aspect-ratio

2026-08-01 — transformation engine (legacy style `new-york`, no base counterpart for this style; AspectRatio has no Base UI primitive, so the target is the base registry's CSS `aspect-ratio` div). Verdict: migrated cleanly, zero consumer changes required.

## Changed

- `src/components/ui/aspect-ratio.tsx` — replaced the `radix-ui` `AspectRatioPrimitive.Root` passthrough with a plain `<div>` using the Tailwind v4 `aspect-(--ratio)` utility driven by a `--ratio` CSS variable, matching the shadcn base registry shape (`ratio` is now a required prop; it was optional with default 1 on Radix, but every consumer already passes it explicitly). Kept the project's `data-slot="aspect-ratio"` and `React.JSX.Element` return-type conventions. Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|IconPlaceholder" src/components/ui/aspect-ratio.tsx` → no matches.

Consumers audited, none needed edits (all pass `ratio` and use `size-full` children, which fill the box identically):
- `src/components/Meetups/MeetupCard.tsx`
- `src/components/Meetups/MeetupModal.tsx`
- `src/components/Meetups/MeetupGallery.tsx`
- `src/components/Meetups/GalleryCard.tsx`
- `src/components/Meetups/MeetupDisplaySettingsCard.tsx`
- `src/components/shared/ImageUploadField.tsx`

Typecheck (`npx tsc --noEmit`) clean before and after.

## Left alone

- All other ui wrappers still on radix (see derived count below) — out of scope for this run.
- `components.json` still reads `"base": "radix"` with legacy style `new-york`; flip happens after the last wrapper migrates.

## Behavior changes

- Radix hard-clamps content via an absolutely-positioned inner box; the CSS `aspect-ratio` version treats the ratio as preferred, so a child taller than the ratio box could stretch the container. No current consumer can hit this (all children are `size-full`), but future children with intrinsic height behave differently. Flagged, not patched — this is the idiomatic base registry behavior.
- `ratio` is now required instead of defaulting to 1. All existing call sites pass it.

## Verify by hand

1. Open a meetup card list — card images should render at 2:1 with `object-cover` cropping, no layout shift while loading.
2. Open a meetup modal with an image — hero image at 2:1.
3. Open the gallery view — gallery tiles and the "Add gallery" tile square (1:1).
4. Meetup display settings → image upload area holds 16:9 while empty and with a preview image.
