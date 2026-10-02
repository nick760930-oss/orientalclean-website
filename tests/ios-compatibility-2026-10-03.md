# iOS / Safari compatibility hardening — 2026-10-03

Scope: compatibility improvements for the current `/brand-preview.html` water-light design. This is **not** an iPhone Safari device certification.

## What was actually verified in this run

- Latest branch before changes: `6b3d327c60798ab34465cbbb11a0d5c3c34ed45c`.
- WebKit browser binary was not present in the execution environment. An ephemeral Playwright WebKit download was attempted, but DNS access to the Playwright CDN failed; no user machine was modified and no browser restriction was bypassed.
- Current deployment after the compatibility fixes is `dpl_3waHDLyTjR77ubZJ52TqCgNfFkcK`, commit `6da8f789bbc7b81e16dcff704a73c2ac590b5728`, READY, Preview, branch `v8-self-optimized`.
- Vercel connector returned HTTP 200 for the current HTML, CSS, UI JavaScript and motion JavaScript. Preview remains `noindex`.

## Compatibility changes made

1. `-webkit-text-size-adjust:100%` and standards `text-size-adjust:100%` are set to prevent unexpected automatic iOS text inflation while still allowing normal page zoom.
2. `100vh` fallbacks are declared before `100svh` / `100dvh` so older engines do not lose viewport sizing.
3. Safe-area variables using `env(safe-area-inset-*)` are added and applied to the masthead, cover, primary directory and footer, improving portrait/landscape notch and home-indicator spacing.
4. Modal routes now add a `panel-open` class so the background page cannot continue scrolling behind a native `dialog`.
5. Reduced-motion horizontal gallery movement now uses standards-compatible `behavior:'auto'` instead of `'instant'`.
6. WebGL fragment precision is negotiated at runtime. High precision is used when the implementation reports it; otherwise the shader falls back to `mediump` instead of unnecessarily dropping to the Canvas2D renderer.

## Brand-color cross-check

The user-provided original logo JPEG (480×296) was inspected locally. Cyan-biased pixels had a median around RGB `118,191,201` (`#76BFC9`). The current UI variable is `#76C0CA`, differing by roughly one level in green/blue. This supports the present visual direction, but the JPEG is lossy and therefore **does not replace an authoritative lossless brand specification**.

Contrast against the current paper tone `#F8FAF8`:
- primary ink `#173E46`: ~11.04:1
- link `#246A77`: ~5.88:1
- muted text `#567179`: ~4.96:1
- brand cyan `#76C0CA`: ~1.97:1

Therefore cyan remains a graphic/accent color and should not be used for ordinary small text on the paper background.

## Still not verified

- Physical iPhone Safari / iOS GPU rendering.
- VoiceOver rotor/order and actual iOS Dynamic Type behavior.
- Real-device safe-area behavior in landscape.
- Real-device power use, thermals, FPS and Core Web Vitals.
- Authoritative PNG/logo source color specification.

These remain open quality gates; do not describe this document as proof of iPhone Safari certification.
