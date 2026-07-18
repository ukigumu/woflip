# Frontend migration guide

This guide is for replacing the seeded synchronous store after the Django API is
available. Do not adapt screens directly to raw HTTP calls.

## 1. Introduce the API boundary

- Configure the public base URL as `EXPO_PUBLIC_API_URL`. Expo public variables
  are bundled into the client, so this value may contain a URL but never a secret.
- Add a typed API client that handles JSON, bearer authorization, refresh,
  idempotency keys, stable backend errors, and request cancellation.
- Add an authentication provider above the application router. Store access and
  refresh tokens in `expo-secure-store` on iOS/Android, not in SQLite.
- Decide the web token strategy before enabling authenticated web builds;
  SecureStore has no web equivalent.

## 2. Preserve a repository interface

Replace `src/lib/store.ts` behind feature-oriented repositories/hooks rather
than rewriting screens around `fetch`:

```text
auth       → session, registration, login, logout
teams      → memberships, active team, invitations, visibility
schedule   → shift types, assignments, week copy, today view
offers     → list, create, claim, cancel
swaps      → preview, create, inbox, accept, decline, cancel
```

Queries become asynchronous and expose `loading`, `error`, `data`, and `refresh`.
Mutations should optimistically update only safe personal schedule edits; offer
claims and swap acceptance wait for the authoritative server response.

## 3. Map current local concepts

| Demo concept | Backend replacement |
| --- | --- |
| `Member.isMe` | Authenticated user and active membership |
| Single `Group` | Active team selected from `/teams` |
| `shareFullSchedule` | Membership `scheduleVisibility` |
| Local `ShiftType[]` | Membership-scoped shift-type endpoints |
| Assignment ID `${memberId}:${date}` | Server UUID plus membership/date |
| `computeCandidates()` | `POST /swap-requests/preview` |
| `simulateResponse()` | Remove; real recipient inbox and accept/decline |
| Local request counter | Server rate limit and returned quota metadata |
| Seed/reset functions | Development fixtures owned by the backend |

Keep `src/lib/matching.ts` tests as behavioral reference while porting rules,
but do not use client matching as authorization or as the final candidate count.

## 4. Privacy behavior

- Add the profile control with two choices: `Only me` and `My team`.
- Default to `Only me` and persist it with the membership endpoint.
- The team schedule and Today screens render exactly what the server returns;
  they must not reconstruct hidden schedules from cached assignment data.
- On a change from `team` to `private`, invalidate team schedule caches and remove
  cached rows for that membership from other users' local databases.
- Use only `work`, `day_off`, and `unknown`. Do not add absence reasons or medical
  fields to frontend types, forms, telemetry, or notifications.

## 5. Offline and synchronization

- Keep SQLite for cached query results and an authenticated user's pending
  personal schedule mutations.
- Queue assignment upserts/deletes with idempotency keys and the observed server
  version; retry with exponential backoff when connectivity returns.
- On `409`, stop retrying, fetch the affected week, and ask the user to reapply
  their change.
- Never queue offer claims or swap acceptance offline because their validity is
  time-sensitive and transactional.
- Clear all user-scoped caches and SecureStore tokens on logout. Keep the chosen
  API URL and non-sensitive appearance preferences only.

## 6. Screen migration order

1. Authentication and team selection.
2. Onboarding creates/updates server shift types and the first week.
3. Week and profile use asynchronous schedule queries/mutations.
4. Today consumes the privacy-filtered server projection.
5. Offers replace local actions with transactional endpoints.
6. Swap wizard uses preview/create; Changes adds the recipient inbox and removes
   demo response simulation.

Every migrated screen needs loading, empty, offline, authentication-expired, and
retry states. Preserve the current fast seven-tap interaction by batching the
onboarding week save and optimistically updating ordinary day edits.

## 7. Acceptance checklist

- A user can belong to two teams without schedules or privacy crossing teams.
- Private assignments never appear in teammate API payloads or SQLite caches.
- Team-visible assignments appear only to active members of that team.
- The app never asks for, stores, logs, or sends an absence reason.
- Unknown and confirmed day off remain visually and semantically distinct.
- Blind preview exposes only a count; identity appears only after acceptance.
- Concurrent claims/acceptances produce one winner and a recoverable conflict.
- Offline personal edits synchronize once and do not duplicate assignments.
- Logout removes credentials and user-scoped cached data.

