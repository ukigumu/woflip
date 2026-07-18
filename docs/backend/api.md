# HTTP API contract

The production API is versioned under `/api/v1/`, uses JSON, and publishes an
OpenAPI schema. Dates are `YYYY-MM-DD`; timestamps are ISO 8601 UTC strings.

## Authentication

Use short-lived bearer access tokens and rotating refresh tokens:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/me
```

The Expo client stores tokens in `expo-secure-store`, never SQLite. Web needs a
separate secure-cookie strategy because SecureStore has no web equivalent.

## Teams and memberships

```text
GET    /api/v1/teams
POST   /api/v1/teams
GET    /api/v1/teams/{team_id}
POST   /api/v1/teams/{team_id}/invitations
POST   /api/v1/invitations/{token}/accept
GET    /api/v1/teams/{team_id}/members
PATCH  /api/v1/memberships/{membership_id}
DELETE /api/v1/memberships/{membership_id}
```

The membership patch permits the owner to change only their own
`schedule_visibility`. Membership owners may invite/remove members but may not
change another member's visibility or schedule.

## Shift types and assignments

```text
GET    /api/v1/memberships/{membership_id}/shift-types
POST   /api/v1/memberships/{membership_id}/shift-types
PATCH  /api/v1/shift-types/{shift_type_id}
DELETE /api/v1/shift-types/{shift_type_id}

GET    /api/v1/me/assignments?team_id=&from=&to=
PUT    /api/v1/me/assignments/{date}
DELETE /api/v1/me/assignments/{date}?team_id=
POST   /api/v1/me/assignments/copy-week
GET    /api/v1/teams/{team_id}/schedule?from=&to=
GET    /api/v1/teams/{team_id}/today?date=
```

`PUT` is an upsert and requires `team_id`, `shift_type_id`, and optional override
intervals. `DELETE` returns the date to unknown; assigning a rest type confirms a
day off.

The team schedule endpoint filters each membership server-side:

```json
{
  "membershipId": "uuid",
  "displayName": "Ana",
  "visibility": "private",
  "assignments": null
}
```

For `team` visibility, `assignments` contains the requested exact schedule. A
private schedule is not downloaded as redacted assignment rows.

## Offers

```text
GET  /api/v1/teams/{team_id}/offers?status=open
POST /api/v1/offers
POST /api/v1/offers/{offer_id}/claim
POST /api/v1/offers/{offer_id}/cancel
```

Creation accepts an assignment ID and optional note. Claim/cancel responses
return the final offer and affected assignments. Conflict or stale-version
failures return `409` with a stable error code.

## Blind swap requests

```text
POST /api/v1/swap-requests/preview
POST /api/v1/swap-requests
GET  /api/v1/swap-requests?team_id=&scope=mine
GET  /api/v1/swap-requests/inbox?team_id=
GET  /api/v1/swap-requests/{request_id}
POST /api/v1/swap-requests/{request_id}/accept
POST /api/v1/swap-requests/{request_id}/decline
POST /api/v1/swap-requests/{request_id}/cancel
```

Preview and creation accept only `assignment_id` and `mode`. A requester sees:

```json
{
  "id": "uuid",
  "status": "open",
  "mode": "rest_day",
  "compatibleCount": 3,
  "acceptedBy": null
}
```

Candidate IDs and scenario details are absent. An inbox recipient receives only
the proposed outcome needed to decide. After acceptance, both participants may
see each other's display name and the applied exchange.

## Errors, pagination, and concurrency

Errors use one stable envelope:

```json
{
  "error": {
    "code": "assignment_conflict",
    "message": "The schedule changed; refresh and try again.",
    "fields": {}
  }
}
```

- `400`: malformed or invalid input
- `401`: missing/expired authentication
- `404`: missing resource or inaccessible team-scoped resource
- `409`: stale version, already resolved, or conflicting assignment
- `422`: domain rule prevents the requested swap
- `429`: preview/request rate limit exceeded

List endpoints use cursor pagination. Mutations accept `Idempotency-Key`; update
payloads include the last observed `version` when modifying an existing object.

