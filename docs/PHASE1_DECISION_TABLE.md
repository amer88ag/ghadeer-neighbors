# Phase 1 — Decision Table

Repository: `amer88ag/ghadeer-neighbors`  
Branch: `cleanup-phase1-critical-fixes`  
Base: `main`  
Production: **paused**

This table records the current decision for every file changed by the branch, based on source inspection and the live Supabase read-only checks.

| File | Decision | Evidence / reason | Next action |
|---|---|---|---|
| `app.js` | KEEP + refine | Initialization had unsafe optional-element bindings; the branch now uses guarded bindings and wraps initialization. `GHADEER_CTX` is required by `outing-events-enhancement.js`. Member-auth preselection was also corrected. | Continue source-level runtime audit before Preview. |
| `enhancements.js` | KEEP | Removed a loader for missing `home-customizer.js` and guarded `servicesHtml`. Both changes prevent a missing dependency from breaking enhancement startup. | Verify final build script order. |
| `quran-enhancement.js` | KEEP | Legacy Quran controls may not exist in the production-built page; guards prevent null-element failures. | Verify whether this module should remain in the final build or be isolated later. |
| `production-bridge.js` | KEEP WITH REVIEW | Uses `public_members`, which is a real live view exposing only `id,name,active`. | Confirm whether this bridge is still required after final build audit. |
| `runtime-fix.js` | KEEP WITH REVIEW | Same public-member source correction; must not become a second competing initialization layer. | Trace load order and remove duplication if it is redundant. |
| `service-pages.js` | KEEP WITH REVIEW | Member source now points to the real `public_members` view. | Verify that this module does not independently initialize or overwrite core state. |
| `services-enhancement.js` | KEEP WITH REVIEW | Member source correction is consistent with the live view. | Verify load order and duplicated member loading. |
| `scripts/sql/phase1-isolation-check.sql` | KEEP | Read-only diagnostic only. No DDL/DML. | Keep as audit evidence; update if additional checks are required. |
| `docs/PHASE1_TEST_PLAN.md` | KEEP | Defines safe functional testing order and DB safety rules. | Execute only after source and DB checks reach the required gate. |
| `vercel.json` | KEEP TEMPORARILY | Production is explicitly skipped; Preview is allowed by configuration. | Do not trigger Preview until Phase 1 gate is complete. |

## Live database findings

Project: `xewjakfmdfkbhcnxglct`

### 1. Core tables
The following live tables have RLS enabled:
- `members`
- `coffee_schedule`
- `outings_schedule`
- `group_messages`
- `announcements`
- `member_permissions`
- `neighbor_check_ins`
- `outings_schedule`

`public_members` is a **view**, not a table. Its definition exposes only:
`id, name, active` from active members.

### 2. Public member access
The live database still has a public SELECT policy on `members` for active members, while the application now reads `public_members`.

Decision: **do not widen permissions**. The application should continue using the restricted view unless a later security review proves a better design.

### 3. RPC existence and signatures
The required outing/event/neighbor RPCs queried from the application exist in the live database, and their actual argument names/types were inspected.

Important result: the RPC layer is real; it must be matched exactly from the live signatures rather than inferred from migration filenames.

### 4. RPC execution privilege
The inspected RPCs are executable by `anon`. This is **not yet classified as a defect by itself**, because the inspected SECURITY DEFINER functions perform PIN/role validation internally.

However, this is a security-review item: every exposed RPC must be verified to enforce its authorization before any state-changing operation.

## Phase 1 gate

The branch is **NOT ready for Preview yet**.

Required before Preview:
1. Finish the source-level initialization audit.
2. Complete the decision table for any newly discovered file/function.
3. Verify all state-changing RPC authorization paths.
4. Verify final build output and script order.
5. Only then run Preview functional tests.

No Production deployment or database migration is authorized by this phase.
