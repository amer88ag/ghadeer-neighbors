# Quran2 Integration Contract

This document defines the single integration contract for the Quran service.

- Canonical service key: `svc_quran2`
- Canonical route: `/quran2`
- Canonical role: `faith`
- Legacy Quran runtime must not be registered as an active route.
- UI navigation must resolve the service through the central service registry.
- The Quran module must own its internal UI only; it must not directly replace the global renderer or history manager.
- A route is not considered verified merely because its file exists.
- Verification requires: UI -> serviceKey -> registry -> route -> entry -> function -> data source -> result -> error handling.

## Release gates

The following remain unverified until tested in the actual application runtime:

- Complete 114-surah offline download and reload.
- Tafsir source and rendering.
- Tajweed source and rendering.
- Recitation recording and correction engine.
- Hifz/review workflow.
- Mobile/accessibility behavior.
- Regression against all existing services.
