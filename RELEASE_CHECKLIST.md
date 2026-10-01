# RELEASE CHECKLIST — Ghadeer Neighbors

A release is approved only after every applicable item below passes.

## Architecture & duplication
- [ ] No duplicate services or duplicate service keys.
- [ ] Each service has one entry point and one owning page.
- [ ] No module directly mutates `window.render`, central state, or navigation history.
- [ ] No direct backend calls from HTML.

## Functional behavior
- [ ] Permissions/authorization tested.
- [ ] Back/navigation behavior tested.
- [ ] Loading state tested.
- [ ] Empty state tested.
- [ ] Error state tested.
- [ ] Double-click / repeated-submit protection tested.
- [ ] Page refresh/reload tested.
- [ ] Network interruption/retry tested.
- [ ] Mobile/touch behavior tested.
- [ ] Existing/legacy services regression-tested after new services are added.

## Data & database
- [ ] Database changes are isolated in migrations.
- [ ] Migration order verified.
- [ ] Rollback plan documented and tested where applicable.
- [ ] Permissions/RLS/RPC dependencies reviewed.

## Build & release
- [ ] Build succeeds from the intended `main` commit.
- [ ] All referenced files exist and are included in the production artifact.
- [ ] Service/module references resolve to the correct owner/entry point.
- [ ] Production deployment completes successfully.
- [ ] The exact production URL is opened and tested after deployment.
- [ ] Vercel and Cloudflare deployments are checked independently when both are configured.

## Final rule

A green build alone is NOT sufficient for release approval. The production URL must be tested against the release commit, including the affected modules and regression checks.
