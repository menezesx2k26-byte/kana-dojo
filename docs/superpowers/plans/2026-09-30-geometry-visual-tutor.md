# Geometry visual tutor implementation plan

> **For agentic workers:** Use superpowers:executing-plans, implementing the user's takeover gates in this session. The takeover explicitly authorizes continuous implementation, commits and branch preview; do not stop at a design approval handoff.

**Goal:** Teach recognition of geometric relationships before algebra, with a complete altitude/orthocenter study using A=(2,-1), B=(0,3), C=(1,2).
**Architecture:** Keep the exact parser, deterministic tutor, Zustand ledger and isolated GeoGebra documents. Extract the existing workspace and ledger; use one isotropic SVG scene with semantic constructions and a concept tutor that reveals only the current relationship. Source exercises retain their stable IDs; the requested triangle is a separately labeled derived study.
**Tech stack:** Existing React 19, Next.js static export, TypeScript, SVG, CSS, Vitest, Playwright/Chromium; no new packages.
**Spec:** User attachment TAKEOVER_HARDNESS_GEOMETRIA_ANALITICA_DOJO.txt; historical source spec in handoff repo docs/superpowers/specs/2026-09-29-geometria-analitica-dojo-design.md.

## Global constraints

- Canonical repository menezesx2k26-byte/kana-dojo; branch feat/geometria-analitica-dojo. Never merge main or reset the takeover reference.
- No paid AI, external answer submission, private PDF publication, dependency upgrades, DNS or production changes.
- Only validated/corrected ledger entries are premises; correct answers without evidence stay calculated.
- Keep all 79 source questions and unsupported parabola provenance. Explicitly mark the requested triangle and concept explanations as derived.
- Desktop and 390×844: geometry first, readable math, no overflow, keyboard support and reduced motion.
- Each implementation gate gets tests, browser inspection, correction and a separate commit.

## Review focus

1. Reopening a validated altitude must hide H and invalidate intersection; test tutor + browser.
2. Persisted forged states cannot reveal unproved lines or intersection; replay tests + browser reload.
3. Midpoint confusion must show median/altitude contrast without accepting midpoint as an altitude premise; pedagogy + UI tests.
4. Axis scaling must preserve actual 90° and external side extensions; scene geometry tests + screenshots.
5. GeoGebra failures and forged messages cannot break the study or access answers; existing isolation tests + browser network checks.

## Gate 0 — reconcile and establish baseline

- [x] Fetch/reconcile HEAD bd6d179d98ef913358cf73bf24c428dd892a3ec7; clean branch; main 98266cab578d10f6d4fe37aebe2b993c6069dd4c; 3 commits ahead.
- [x] Read canonical instructions/docs/core files/tests and handoff instructions/spec/learner state/source README; inspect original PDFs with pdftotext.
- [x] Run geometry:test (54 tests), geometry:check, geometry:build.
- [x] Capture/inspect baseline Chromium screenshot: 00-baseline-desktop.png, no overflow.
- [x] Commit this factual reconciliation and plan.

## Gate 1 — study canvas foundation

**Files:** GeometryDojo.tsx, new StudyWorkspace.tsx and StudyLedger.tsx; geometry/app/globals.css.
**Interfaces:** StudyWorkspace({activity: Activity, session: Session}); StudyLedger({activity, session, onReview}).

- [x] Extract without changing math contracts, place geometry above tutor/ledger in DOM, with broad desktop canvas and compact companion column.
- [x] Replace card-heavy olive shell with warm paper / blue ink and serif mathematical headings; retain clear and dark themes.
- [x] Unit/render regression: figure precedes ledger and tutor; existing suite/check pass.
- [x] Chromium desktop/mobile screenshots, overflow and console check; commit.

## Gate 2 — semantic scene

**Files:** new lib/scene.ts, components/GeometryScene.tsx; GeometryVisual.tsx; scene tests.
**Interfaces:** frameFor(points): isotropic frame; projectToLine(point,a,b); Scene supports active vertices/opposite sides, finite segments/infinite lines, midpoint/ticks, right-angle markers, extension/intersection and authored revealAfter.

- [x] Test isotropic mapping, projection dot product zero and reveal gating.
- [x] Replace StaticDiagram's fixed distorted grid with geometry-framed semantic renderer, intelligent label offsets and accessible textual alternative.
- [x] Browser inspect marker/labels/viewport; suite/check; commit.

## Gate 3 — median/altitude/bisector comparison

**Files:** new ConceptComparison.tsx and comparison tests.
**Interfaces:** ConceptComparison({vertex?: 'C'|'A', mode, onMode}) uses authored triangle; no intersection or numeric auxiliary labels.

- [x] Short visual interaction with three named constructions; median shows midpoint/ticks, altitude shows vertex/perpendicular and external-side extension, bisector shows midpoint/perpendicular independent of vertex.
- [x] Test required signatures and error explanation; browser capture all three; commit.

## Gate 4 — altitude/orthocenter vertical slice

**Files:** activities.ts, new data/altitudeActivity.ts, lib/concepts.ts, components/AltitudeTutor.tsx, tutor tests.
**Interfaces:** derived study id altura-ortocentro, validated steps altura-c, altura-a, ortocentro; conceptual stages select vertex, opposite side, perpendicular relation, algebra translation.

- [x] Test equivalent lines y=x/2+3/2 and x-2y+3=0; y=x-3 and x-y-3=0; H=(9,6), using exact incidence/perpendicularity proofs with already validated lines.
- [x] Reject premature intersection, midpoint tool/median line, wrong passage/perpendicularity; retain correct result pending proof and ambiguity.
- [x] Construct tool from geometry; keep open explanation/result/evidence fields and conceptual decisions grouped.
- [x] Reveal first/second finite projection independently; show full altitude lines/H only after intersection validated, avoiding graphical early answer leak.
- [x] RESET clears visual noise and pending entry while preserving previous correct ledger; complete/reload/review browser journey; commit.

## Gate 5 — integrate existing tutor

**Files:** tutor.ts, useGeometryStore.ts, new RelationTutor.tsx; store/tutor/UI tests.

- [x] Replace blind dropdown in existing activities with relationship recognition followed by supported tool choices and open rationale.
- [x] Persist/replay derived study with valid IDs; retain legacy sessions and first divergence; diagnose conceptual/algebraic/notational/interpretation/representation internally.
- [x] Test forged statuses, correction invalidation, pending evidence, no penalty for ambiguity and scoped reset; full suite/check/browser; commit.

## Gate 6 — GeoGebra exploration

**Files:** visual.ts, GeometryVisual.tsx, build-geometry.ts and visual tests.

- [x] Keep official applet as optional integrated exploration of validated constructions; full scene replaces fallback only once ready.
- [x] Match isotropic framing/mobile host, visible semantic markers, reset/zoom and lazy load. Pass only authored IDs/stages; no answers, no localStorage, cross-origin isolation remains.
- [x] Browser test real load and blocked-load fallback, isolation and mobile; unit tests; commit.

## Gate 7 — systemic polish

- [x] Review light/dark, desktop/mobile, text/labels, keyboard targets/focus, reading order, completion, hints, provenance and source license.
- [x] Screenshot eight required critical states; fix observed issues and commit with browser evidence.

## Gate 8 — full regression and branch preview

**Files:** scripts/geometry-browser.mjs, docs/GEOMETRY_DOJO.md, docs/GEOMETRY_VERIFICATION.md.

- [x] Full math/tutor/store/scene/UI suite; geometry:check; geometry:build; repeat full Chromium journey against production export.
- [x] Fresh review, address important findings; no tests removed to force green.
- [x] Fetch/reconciliation repeated after green gates; origin feature/main unchanged. Cloudflare access inspected and unavailable. Publish the verified feature history as the final delivery action, preserving every commit SHA and using only fast-forward updates.
- [x] Report commands/counts, screenshots, real limitations, project/URL/SHA or precise deployment access block. Never claim all DoD if real browser load was not verified.

## Execution record

Gate 0: 54/54 tests, TypeScript+ESLint exit 0, static build exit 0. Sources inspected: the exact requested triangle is absent from both lists and is presented as a separately labeled derived exercise, not a numbered source question. Existing AGENTS main-commit/build prohibition is superseded by the explicit feature-branch/geometry-build takeover request.

Gate 1: workspace/ledger extraction and warm paper / blue ink layout, 54/54 baseline retained; desktop/mobile reading order and screenshots verified. Commit 5e51cc201.

Gate 2: semantic isotropic SVG, projection/dot-product tests, ticks/right-angle markers/extensions and accessible selection controls. Commit 3115a5b22.

Gate 3: all three comparison modes inspected in desktop/mobile, with distinct MEIO, 90°, MEIO+90° signatures and no H. Commit f577404c7.

Gate 4: derived altitude study, exact equivalences and two-height intersection proved; unit and browser errors/pending evidence/reset/reload/review journeys green. Commits 1b2470060 and df23bf981. Browser inspection caught canvas/ledger overlap; static positioning removed it.

Gate 5: all seven source journeys complete after relationship recognition, no blind tool dropdown; diagnosis and scoped reset retain valid premises. Commit fb252e972.

Gate 6: 77/77 tests, check/build exit 0. Real official GeoGebra loaded, dynamic foot changed 0.6→0.44 with π/2; H absent, ledger unchanged, parent storage/document blocked. Forced script-load failure preserved SVG and next calculation. Resize overflow and embed auto-scaling defects were observed and corrected before commit 198db5f1c.

Gate 7: 78/78 tests, check/build green. Production Chromium 1440×1000 and 390×844 completed altitude and seven sources, no relevant console/page/network errors, no overflow/label collision/ledger overlap; 32 captures inspected. Focus regression watched fail and pass; fresh rationale, clean restart and ≥44px button targets. Commit 228b65b96.

Final review: fresh gpt-6-astra reviewer examined the whole product diff and production Chromium edges. No Critical. Important inherited persisted-ID crash reproduced in browser; Minor perpendicularity feedback regraded Important because it teaches an unrelated vertex/opposite-side condition in point/line exercises.

Final: fixed inherited selected/session IDs — three hydration regressions RED→GREEN, null-prototype authored activity index rejects Object keys while preserving valid sessions.

Final: fixed point/line feedback — Q15/Q30 concept regressions RED→GREEN, explanations now use the given P and r; unrelated automatic triangle comparison removed. Full suite 83/83; check exit 0.

Ruling: exact ABC request is a separate Derived study — absent from original lists — cost if wrong: reference correction without renumbering the 79 questions.

Ruling: explicit feature branch/geometry build takeover overrides generic main/build root instructions — user's scoped continuation is binding — cost if wrong: delivery-flow correction; main remains unchanged.

Ruling: review's feedback Minor regraded Important and fixed — false geometric context can mislead a student — cost if wrong: extra regression/fix effort, no loss of valid source behavior.

Deferred minors: none.

Gate 8 deployment ruling: no Cloudflare credential, identity, runtime variable or callable connection is exposed; relevant repo configuration inspected without touching other products. Finish code/tests/branch push and report missing preview access; no duplicate or alternative host.

Gate 8: full suite 83/83; TypeScript/ESLint and production build exit 0. Production browser re-run after review fixes verified build 88a40a1c42eef6c014cba805be47c2a4a95031b9: 12 journeys, real/failure GeoGebra, 32 captures, no relevant errors/overflow/label collisions. Repeatable npm geometry:browser and verification docs added.

Delivery: Git HTTPS authentication failed even though GitHub API confirmed push access. The Git-data API accepts the authorized objects; publication reconstructs each local blob/tree/commit, verifies identical SHA, and updates only the feature ref with force=false. Final source SHA is reported by the last commit and the export/browser manifests.
