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

## Final security decisions for Phase 1

### `accept_program_terms`
**Decision: FIX NOW — applied in live Supabase and recorded in migration.**

The previous function accepted `p_member_id` and `p_member_name` without proving control of the member PIN. It has been replaced with a five-argument function that verifies the active member, member name, and `p_pin` before recording acceptance. `app.js` now supplies the current authenticated member PIN.

### PIN brute-force protection
**Decision: FIX NOW — applied in live Supabase and recorded in migration.**

No dedicated login-attempt/lockout table existed before this change. `member_login` and `manager_pin_login` were therefore vulnerable to repeated guessing. A database-side `login_attempt_limits` table and throttling were added. Failed attempts are counted per member or for the manager globally; after 8 failures within the active window the key is locked for 15 minutes. Successful authentication clears the limiter.

The limiter table has RLS enabled and no direct `anon`/authenticated privileges.

## Phase 1 gate status

**SOURCE CHECK: PASS**
- Direct `$("refreshBtn").onclick` binding: **0 occurrences**.
- Guarded `bindEl(...)` calls in `app.js`: **42 occurrences**.
- `GHADEER_CTX`: defined and its required consumers were checked.
- Member-auth preselection: implemented.

**DATABASE CHECK: PASS for the Phase 1 security items above**
- `accept_program_terms`: now requires PIN.
- `member_login`: throttled.
- `manager_pin_login`: throttled.
- `login_attempt_limits`: exists with RLS enabled and no direct client privileges.

**DECISION TABLE: CLOSED for current branch changes.**

### Remaining gate before Preview
The remaining non-security gate is a final build/source-order check. After that check, Preview may be opened. Production remains paused.

No Production deployment is authorized by this phase.

## Central PIN verification — current status

**Decision: KEEP PHASE 1 OPEN.** PostgreSQL rolls back writes made in the same transaction when an uncaught exception is raised; therefore a failed-attempt counter cannot be made durable by a helper alone if the caller subsequently raises. This is a database transaction constraint, not a UI issue.

The central entry points remain:
- member: `member_login(bigint,text)`
- manager: `manager_pin_login(text)`

Client execution privileges for both central entry points were revoked from `anon` and `authenticated`; they are internal database helpers.

The first bypass path, `issue_member_device_token`, has been converted to consume `member_login` and return `success:false` instead of raising after failed authentication. Its token-generation `crypt(token,gen_salt('bf'))` remains unchanged because that is token hashing, not PIN verification.

**Not yet closed:** all remaining functions that compare member/manager PINs directly must be converted to the two central entry points, and authentication-failure branches must return a normal failure result rather than raise. No Preview until the direct-PIN verification query returns zero rows and the 9-attempt test succeeds on a clearly identified test member.

### Main compatibility decision
The four-argument `accept_program_terms` compatibility function intentionally rejects old clients with `تحديث الصفحة مطلوب قبل تسجيل الموافقة`. This prevents unauthenticated/forged acceptance but temporarily blocks new acceptance on the currently published `main` client until the branch is published. This is an explicit short-lived security-over-availability decision and must be removed after the new client is live.
