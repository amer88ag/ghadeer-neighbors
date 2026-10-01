# MODULE POLICY — Ghadeer Neighbors

## Mandatory module contract

Every feature/service is an independent module.

- Each module MUST have a unique `serviceKey`.
- Each module MUST have exactly one entry point and one owning page.
- A module MUST NOT directly mutate `window.render`.
- A module MUST NOT directly mutate the central navigation/history state.
- HTML MUST NOT call the backend directly; backend access belongs behind the application's data/API layer.
- Database changes MUST be delivered as a separate migration.
- Every migration MUST document a rollback plan.

## Module lifecycle

`draft → ui → connected → tested → verified`

A module is not considered complete merely because its icon or UI is visible. It must pass the complete lifecycle and the release checklist.

## Naming and ownership

- `serviceKey` values must be globally unique within the application.
- Duplicate display names are not sufficient evidence of uniqueness; identity is determined by `serviceKey`.
- A module owns its UI and service-specific behavior through its single entry point/page.
- Cross-module navigation must use the application's navigation contract.

## Compatibility

Adding a module MUST NOT break previously released modules. Existing services must be regression-tested after additions or refactors.
