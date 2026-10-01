# Pre-release audit gate

This branch is an audit gate only. Production deployment remains blocked.

## Required evidence before Release Candidate

- [ ] UI icon resolves to exactly one `serviceKey`
- [ ] `serviceKey` resolves through the canonical service registry
- [ ] Registry resolves to exactly one route
- [ ] Route resolves to exactly one entry module
- [ ] Entry resolves to the intended function/module
- [ ] No legacy Quran runtime is reachable from the canonical Quran route
- [ ] Quran `quran2` entry is present and loaded by the actual application entrypoint
- [ ] All service routes are unique
- [ ] All required icons are wired and clickable
- [ ] Build passes
- [ ] Dist audit passes
- [ ] Regression tests pass
- [ ] Mobile/accessibility checks pass

No item may be marked PASS merely because a file or symbol exists. Evidence must come from the actual runtime path or a deterministic automated check.

## Deployment gate

Vercel and Cloudflare remain blocked until every required item above is verified.
