---
name: threejs-game-director
description: "Entrypoint for building, upgrading, and finishing Three.js browser games. Routes work across the sibling threejs-* skills for gameplay, graphics, UI, debugging, and release. Use for any request to build, upgrade, polish, or ship a Three.js game as a whole, at any scope from a small arcade prototype to a premium release."
---

# Three.js Game Director

Own the end-to-end game outcome: a playable loop first, then the visual and interface depth the request actually asked for, then browser evidence that it works.

## Scope

The user's own words set the bar. "Make a small arcade game" is not a request for the full premium pipeline — build the good version of what was asked and stop. "Premium", "AAA", "polished", "high-fidelity", "showcase", "release-ready", or "less basic" *is* that request, and at that bar a first playable slice is not done. "Less basic" specifically means the current visual level was rejected; treat it as the premium bar.

The user's scope, art style, constraints, and prior decisions override skill defaults. A narrow edit to a premium game remains a narrow edit. If an existing game uses another engine or framework (Babylon.js, PixiJS, Phaser, Unity WebGL, plain canvas), keep it; apply only the engine-agnostic guidance instead of migrating to Three.js. Make routine implementation calls yourself and complete authorized work before seeking a decision that only affects a later step. Ask only when a missing choice materially changes the requested result; continue independent work meanwhile. Until the requested bar is met, don't end a turn with a summary that announces the next step, an offer to continue, or a list of decisions that don't block the work; take the next step instead. End the turn when the work is done, or when only the user can unblock it.

## Working style

Say in one sentence what you're about to do before your first tool call. While working, give a short update when you finish a phase, find something important, or change direction. Lead the final response with the outcome.

The lead owns shared interfaces, integration, and the final verification pass. Use available delegation tools for independent work that saves time or improves quality: asset generation alongside gameplay, or isolated UI work after the intent/state interface is defined. Normally use a lead plus up to two workers. Give each worker a task, separate file ownership, input/output contract, and acceptance criteria. Keep the immediate blocking integration work with the lead.

For substantial gameplay, graphics, or animation changes, one focused independent review can catch missed defects. Supply raw captures/code and the relevant rubric; ask for concrete defects rather than endorsement of the lead's score. Resolve findings without recursive review cycles. When delegation tools are absent, work directly.

Report what you ran and what you saw. If you couldn't run something, say that instead.

## Sibling skills

Use the actual loaded skill directory as `<director-skill-dir>`. Resolve siblings through `../<skill>/SKILL.md` there. If absent, use the runner's discovered skill path, then a matching repo `skills/` directory or the active runner's install location (`~/.agents/skills` for Codex, `~/.claude/skills` for Claude Code, legacy `~/.codex/skills` last). Resolve references relative to the selected skill; avoid mixing installed versions.

| Phase | Skill |
| --- | --- |
| Design brief, core loop, levels, entities, input, camera, physics, feel | `threejs-gameplay-systems` |
| Models, materials, shaders, VFX, lighting, render budget, scorecard | `threejs-aaa-graphics-builder` |
| HUD, menus, overlays, responsive and touch UI | `threejs-game-ui-designer` |
| Blank canvas, render/runtime bugs, mobile input, profiling | `threejs-debug-profiler` |
| Browser QA, screenshots, canvas pixels, bot playtest, production build | `threejs-qa-release` |

For complete games and broad upgrades, read all five production skills before implementing. Read each phase's required references at phase entry. For narrow edits, load the affected specialists and references, preserving unrelated systems. Record actual loaded resources when reporting skill use; a phase label is not a skill invocation.

## Continuity and early quality

Start broad builds with the gameplay design brief, core-loop contract, and level plan. Define art direction, camera scale, and hero/readability targets early. Build or import the hero assets while implementing the loop, then assess a representative playable scene with the real assets before multiplying levels, waves, or enemy variants.

For substantial tasks maintain `artifacts/game-progress.md`: current intent and constraints, decisions, completed work, remaining defects, and next actions. Re-read it after an interruption. A correction updates affected work; a status question does not replace the build objective. Preserve completed assets.

## The bar for premium work

Every visible surface that exists in the design is authored, not just the hero: player, obstacles and enemies, interactables, ground and world kit, HUD and menu states, lighting and materials, feel, and target-device performance. Unrefined primitives, empty arenas, box skylines, generic stat-card HUDs, and glow-or-fog-only detail are prototype placeholders unless the user explicitly chose that style. Interpret the scorecard through the genre rather than adding unrelated content.

Score the result with the 10-category scorecard in `threejs-aaa-graphics-builder/references/visual-scorecard.md`, using its anchors and the inspector's measured metrics rather than a personal rubric. Premium means no category below 2 and an average of at least 2.3.

## Asset sourcing (local install policy)

This install excludes the Tripo, Gemini, and ElevenLabs generator skills and the credential probe. Do not look for API keys, source shell profiles, search for credential files, or call paid generation APIs. Build assets procedurally in Three.js, use Web Audio for synthesized sound, or use assets already in the project or supplied by the user with a known license. Premium hero surfaces still need authored procedural models, materials, and event-driven audio rather than primitives. If an external asset would materially raise quality, say so in the final report instead of fetching it.

## Verification ownership

The lead consolidates specialist results into one check set appropriate to the change. Full games need production build, real-input progression and retry, target-viewport captures, renderer diagnostics, and the premium scorecard when requested. Small edits need affected behavior/layout checks. Repeat checks only after relevant changes, failures, or unresolved concerns. For animated work include motion captures covering locomotion, transitions, and contact timing, not only stills.

## Getting started and checking output

```bash
python3 <threejs-gameplay-systems-skill-dir>/scripts/create_threejs_game.py ./my-game
node <threejs-qa-release-skill-dir>/scripts/inspect-threejs-canvas.mjs --manifest artifacts/evidence.json --url http://127.0.0.1:5188
python3 <director-skill-dir>/scripts/check_evidence.py ./my-game --manifest artifacts/evidence.json
```

Generated games carry their own `npm run inspect:canvas` and `npm run verify:visual`. Before capturing, read `references/evidence-manifest.md` and declare the expected viewport/state pairs for this pass. The checker verifies only that set and its run ID. Its result establishes artifact coverage, not aesthetic quality or gameplay correctness. When maintaining the pack itself, use `references/workflow-evaluations.md` for behavioral comparisons.

## Final response

Lead with what was built, whether it works, the local URL and controls, and remaining limitations. For substantial builds put the design artifacts, asset paths, captures and motion evidence, renderer/physics metrics, tests, and scorecard in `artifacts/final-evidence.md` and link it. For narrow edits report only affected behavior and checks. Describe what ran and was observed; do not substitute a completion claim for missing evidence.
