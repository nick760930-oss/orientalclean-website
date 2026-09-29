# Three.js game skills — provenance

Source: https://github.com/majidmanzarpour/threejs-game-skills @ 8286774b22a2566bf894dbc825825c16921866af (MIT, see upstream LICENSE)

Installed (6): threejs-game-director, threejs-gameplay-systems, threejs-aaa-graphics-builder,
threejs-game-ui-designer, threejs-debug-profiler, threejs-qa-release

Local security changes versus upstream:
- Not installed: threejs-3d-generator (Tripo), threejs-image-generator (Gemini), threejs-audio-generator (ElevenLabs).
- Removed threejs-game-director/scripts/probe_asset_credentials.sh (it sourced ~/.zshrc, ~/.bashrc and profiles to detect API keys).
- Removed threejs-game-director/references/asset-recovery.md (paid-generation recovery and profile-sourcing instructions).
- Rewrote the asset-sourcing sections and generator references in the SKILL.md/reference files to procedural / licensed local assets only.
- Director: keep an existing game's engine instead of migrating to Three.js.
