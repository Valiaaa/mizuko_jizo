# Mizuko Jizō development guide

## Product principles

- This is a chapter-based interactive story, not a conventional multi-page product site.
- Click and drag are primary interactions; every interaction must also have a keyboard or touch path.
- Responsive behavior is based on composition and aspect ratio, not on one fixed design canvas.
- Preserve the authored pace: do not add generic UI, dashboards, or unnecessary navigation chrome.

## Architecture

- Keep chapter metadata in `content/story.ts`.
- Put shared mechanics in `components/`; put chapter-only code in `chapters/<chapter-id>/`.
- Keep original source assets untouched in their current `Page*_asset` directories until the asset pipeline is finalized.
- Do not hardcode cursor image paths in chapter code. Use `data-cursor` and `CursorProvider`.
- A chapter may own local state; cross-chapter progress belongs in a shared story-progress module.

## Interaction and accessibility

- Hide the native cursor only under `(hover: hover) and (pointer: fine)`.
- Cursor hotspots must remain near the upper-left visual tip. Tune `lib/cursor.ts` instead of shifting images in chapter CSS.
- Keep cursor-state fades under 120 ms so the pointer feels immediate.
- Respect `prefers-reduced-motion`.
- All clickable elements need semantic controls and visible focus states.
- Pointer-drag interactions must use pointer capture and support pointer cancellation.

## Quality checks

Before handing off a feature, run:

```bash
npm run typecheck
npm run lint
npm run build
```

Use Conventional Commits, for example `feat(cursor): add drag state`.
