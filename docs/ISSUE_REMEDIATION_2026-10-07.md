# PROMETHEUS issue remediation — 2026-10-07

1. App icon — adaptive and legacy launcher fallbacks aligned to PROMETHEUS icon; Android version bumped to 1.1.0.
2. See more — experiment drawer already had “See more data”; source catalog cards now expose “See more”.
3. Experiment graph — burn duration is now a first-class measured outcome; S1=420 s and S2=70 s from NASA PSI-98 are plotted as a depth axis so the two records visibly separate.
4. Permissions / agreement — granular research/privacy agreement added; local processing, cloud AI, and update behavior are disclosed. No broad storage/camera/mic/location/contact permissions.
5. AI — local evidence engine retained; explicit-consent cloud AI mode added, with a server-side Responses API path and NASA evidence context. Cloud mode falls back safely to local mode when unavailable.
6. More experiment data — five additional NASA investigation-level records added to the embedded corpus: SoFIE-GEL, FLARE, FM², Confined Combustion, and LUCI. They are explicitly metadata-only; no measurements are fabricated.
7. Flame-front measurement — experiment drawer now shows a provenance-safe flame-front/spread measurement when NASA reports one, otherwise “not reported”.
8. Crown Council copyright — LICENSE, NOTICE, citation metadata, update manifest, and app footer identify The Crown Council.
9. Updates — opt-in public update manifest and release-page flow added. APK replacement remains user-confirmed; no silent install.
10. Screen fit — responsive/dvh layout hardening and Android system-bar/display-cutout insets added.
11. Rotation/device differences — adaptive resize behavior enabled, experiment selector made width-safe and kept visible in landscape/portrait, including short-height layouts.
12. “1” typography — numeric controls/data now use tabular/lining numeric typography to avoid ambiguous numeral rendering.
13. iOS — Swift injector class collision fixed; Swift and Objective-C bridges use distinct native class names and documentation now covers both.
14. Synthetic-demo wording — NASA-first wording restored in the visible dataset status; synthetic-demo wording is not presented as the source of NASA evidence.
15. Flame in Freefall sources — catalog expanded with SoFIE, FLARE, FM², Confined Combustion, LUCI, NASA fire-safety overview, flame-study explainer, and additional SoFIE entries while retaining the documented ACME/BASS/DAFT/FLEX/Saffire/SAME/SLICE/SPICE records.

## Verification boundary

Android CI now validates the web fixture, NASA source references, measured SAFFIRE burn-duration records, and JavaScript syntax before the Android build. Device-specific visual validation still requires running the APK on the target phones/tablets because emulator/build CI cannot reproduce every OEM screen, cutout, navigation mode, and rotation combination.
