# Woflip backend blueprint

This folder describes the Django backend planned for the point at which Woflip
stops being a local-only demo. It is documentation only: the current Expo demo
continues to use `src/lib/store.ts` and `expo-sqlite/kv-store`.

## Product boundaries

- Woflip is employee-driven. There is no company administrator, time clock, HR
  workflow, medical record, or absence-reason field.
- A user may belong to multiple teams. Schedules, visibility, shift types,
  offers, and swaps are isolated by team membership.
- Every user enters only their own schedule.
- Schedule visibility is selected per membership and defaults to `private`.
- A non-working day is only `day_off`. Woflip never asks why and never stores
  medical or other absence reasons.
- Blind matching may use private schedules on the server, but identities and
  schedules remain hidden until a swap is accepted.

## Recommended stack

- Django 5.2 LTS and Django REST Framework
- PostgreSQL
- Email/password authentication with short-lived JWT access tokens and rotating
  refresh tokens
- Background jobs for push notifications and expiry processing
- OpenAPI schema generated from the API implementation
- Docker Compose for reproducible local development

Django 5.2 is intentionally selected because it is an LTS release. Pin the
latest compatible patch versions when implementation begins rather than copying
version numbers from this document.

## Documentation map

- [Data model and domain rules](./data-model.md)
- [HTTP API contract](./api.md)
- [Frontend migration guide](./frontend-migration.md)

## Delivery order

1. Authentication, teams, invitations, and memberships.
2. Shift types, assignments, and per-membership privacy.
3. Viewer-filtered team schedule and today endpoints.
4. Broadcast offers with transactional claims.
5. Server-side blind matching and transactional swap acceptance.
6. Push notifications, realtime refresh, audit events, and offline retries.

The backend becomes the source of truth. SQLite remains a cache and offline
outbox; it must not become an alternative authority for permissions or matching.
