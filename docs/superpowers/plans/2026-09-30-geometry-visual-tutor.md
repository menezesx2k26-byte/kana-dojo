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

- [ ] Extract without changing math contracts, place geometry above tutor/ledger in DOM, with broad desktop canvas and compact companion column.
- [ ] Replace card-heavy olive shell with warm paper / blue ink and serif mathematical headings; retain clear and dark themes.
- [ ] Unit/render regression: figure precedes ledger and tutor; existing suite/check pass.
- [ ] Chromium desktop/mobile screenshots, overflow and console check; commit.

## Gate 2 — semantic scene

**Files:** new lib/scene.ts, components/GeometryScene.tsx; GeometryVisual.tsx; scene tests.
**Interfaces:** frameFor(points): isotropic frame; projectToLine(point,a,b); Scene supports active vertices/opposite sides, finite segments/infinite lines, midpoint/ticks, right-angle markers, extension/intersection and authored revealAfter.

- [ ] Test isotropic mapping, projection dot product zero and reveal gating.
- [ ] Replace StaticDiagram's fixed distorted grid with geometry-framed semantic renderer, intelligent label offsets and accessible textual alternative.
- [ ] Browser inspect marker/labels/viewport; suite/check; commit.

## Gate 3 — median/altitude/bisector comparison

**Files:** new ConceptComparison.tsx and comparison tests.
**Interfaces:** ConceptComparison({vertex?: 'C'|'A', mode, onMode}) uses authored triangle; no intersection or numeric auxiliary labels.

- [ ] Short visual interaction with three named constructions; median shows midpoint/ticks, altitude shows vertex/perpendicular and external-side extension, bisector shows midpoint/perpendicular independent of vertex.
- [ ] Test required signatures and error explanation; browser capture all three; commit.

## Gate 4 — altitude/orthocenter vertical slice

**Files:** activities.ts, new data/altitudeActivity.ts, lib/concepts.ts, components/AltitudeTutor.tsx, tutor tests.
**Interfaces:** derived study id altura-ortocentro, validated steps altura-c, altura-a, ortocentro; conceptual stages select vertex, opposite side, perpendicular relation, algebra translation.

- [ ] Test equivalent lines y=x/2+3/2 and x-2y+3=0; y=x-3 and x-y-3=0; H=(9,6), using exact incidence/perpendicularity proofs with already validated lines.
- [ ] Reject premature intersection, midpoint tool/median line, wrong passage/perpendicularity; retain correct result pending proof and ambiguity.
- [ ] Construct tool from geometry; keep open explanation/result/evidence fields and conceptual decisions grouped.
- [ ] Reveal first/second finite projection independently; show full altitude lines/H only after intersection validated, avoiding graphical early answer leak.
- [ ] RESET clears visual noise and pending entry while preserving previous correct ledger; complete/reload/review browser journey; commit.

## Gate 5 — integrate existing tutor

**Files:** tutor.ts, useGeometryStore.ts, new RelationTutor.tsx; store/tutor/UI tests.

- [ ] Replace blind dropdown in existing activities with relationship recognition followed by supported tool choices and open rationale.
- [ ] Persist/replay derived study with valid IDs; retain legacy sessions and first divergence; diagnose conceptual/algebraic/notational/interpretation/representation internally.
- [ ] Test forged statuses, correction invalidation, pending evidence, no penalty for ambiguity and scoped reset; full suite/check/browser; commit.

## Gate 6 — GeoGebra exploration

**Files:** visual.ts, GeometryVisual.tsx, build-geometry.ts and visual tests.

- [ ] Keep official applet as optional integrated exploration of validated constructions; full scene replaces fallback only once ready.
- [ ] Match isotropic framing/mobile host, visible semantic markers, reset/zoom and lazy load. Pass only authored IDs/stages; no answers, no localStorage, cross-origin isolation remains.
- [ ] Browser test real load and blocked-load fallback, isolation and mobile; unit tests; commit.

## Gate 7 — systemic polish

- [ ] Review light/dark, desktop/mobile, text/labels, keyboard targets/focus, reading order, completion, hints, provenance and source license.
- [ ] Screenshot eight required critical states; fix observed issues and commit with browser evidence.

## Gate 8 — full regression and branch preview

**Files:** scripts/geometry-browser.mjs, docs/GEOMETRY_DOJO.md, docs/GEOMETRY_VERIFICATION.md.

- [ ] Full math/tutor/store/scene/UI suite; geometry:check; geometry:build; repeat full Chromium journey against production export.
- [ ] Fresh review, address important findings; no tests removed to force green.
- [ ] Fetch before non-force feature-branch push. Inspect existing dedicated Cloudflare project only after green gates; deploy preview if actual access permits.
- [ ] Report commands/counts, screenshots, real limitations, project/URL/SHA or precise deployment access block. Never claim all DoD if real browser load was not verified.

## Execution record

Gate 0: 54/54 tests, TypeScript+ESLint exit 0, static build exit 0. Sources inspected: the exact requested triangle is absent from both lists and is presented as a separately labeled derived exercise, not a numbered source question. Existing AGENTS main-commit/build prohibition is superseded by the explicit feature-branch/geometry-build takeover request.
