# Phase 1 test plan — حي الغدير

## Safety
Preview uses the real Supabase project. Do not test destructive operations.
Do not restore backups or change the manager PIN.
Any created test record must contain «اختبار», use a far-off date where applicable, and be deleted after verification.

## Order

### 1. Database isolation — BEFORE UI
Run:
scripts/sql/phase1-isolation-check.sql

Record:
- RLS state
- anon privileges
- members policies
- public_members exposure
- anon-executable functions
- tables containing community_id

Result: ______

### 2. Authentication
- Open Preview.
- Test normal member login.
- Reload after login.
- Logout.
- Test manager login without changing credentials.

Result: ______

### 3. Neighbors
- Load neighbor directory.
- Open a neighbor.
- Search/select a neighbor.
- Test neighbor check.
- Verify no protected members fields are exposed.

Result: ______

### 4. Coffee
- Open coffee.
- Create a test appointment only if needed.
- Test apology.
- Test undo.
- Reload and verify persistence.
- Delete test record.

Result: ______

### 5. Messages
- Open messages.
- Test sending a clearly marked «اختبار» message if safe.
- Verify manager-only edit/delete behavior.
- Remove test data.

Result: ______

### 6. Outings
- Open outings.
- Test creation using «اختبار».
- Test plan flow, voting, rating, and expenses only if each control exists.
- Remove test records afterward.

Result: ______

### 7. Occasions
- Test create/display/edit/delete only where the UI exposes those controls.
- Use «اختبار».
- Remove test data.

Result: ______

### 8. Manager
- Verify all manager controls are bound.
- Do not test backup restore.
- Do not change manager PIN.

Result: ______

## Exit criteria
Phase 1 is not complete until:
- Preview builds.
- Production remains paused.
- Isolation SQL has been reviewed.
- No critical runtime errors occur.
- Core tested controls work.
- No unintended real-neighbor data is created or modified.
