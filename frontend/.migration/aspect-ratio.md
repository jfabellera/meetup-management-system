# aspect-ratio

2026-08-01 — transformation engine (legacy style `new-york`, no base counterpart for this style; AspectRatio has no Base UI primitive, so the target is the base registry's CSS `aspect-ratio` div). Verdict: migrated cleanly, zero consumer changes required.

## Changed

- `src/components/ui/aspect-ratio.tsx` — removed the `radix-ui` `AspectRatioPrimitive.Root` passthrough. **Correction (2026-08-02):** the first attempt used the shadcn base-registry shape (single div + Tailwind `aspect-(--ratio)`), but bare CSS `aspect-ratio` lets layout context override the box height in some cases — a rounded avatar (ImageUploadField, ratio 1) rendered as an oval. Reverting the commit fixed it, confirming this file. Final version reproduces Radix's proven technique as a plain div (still no radix import): an outer `relative w-full` box with inline `padding-bottom: ${100/ratio}%` (ratio-forced height that layout can't collapse) and an inner `absolute inset-0` layer holding the children. `ratio` defaults to 1. Verified in-browser (headless Chrome): the register-page avatar renders a 160×160 circle with a landscape image, and MeetupCards render exact 2:1 boxes with the image filling them. Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|IconPlaceholder"` → no matches.

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
