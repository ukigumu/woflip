# Woflip

**Free shift-organization app for hospitality workers** who do not have (or do not want) a company admin in the loop.

Expo / React Native. You enter **your own shifts**, share with teammates on your terms, and trade coverage via offers and blind swap matching. No clock-in, no chat, no HR admin — that lives in **Woblip**. Woflip is the worker-side tool (and a natural acquisition channel toward Woblip when a workplace later wants company features).

## Who it’s for

- Waiters, cooks, floor staff, and other shift workers
- Teams that coordinate peer-to-peer without a rota manager
- Anyone who wants schedule privacy by default

## What you get

- **Own shifts only** — you never edit someone else’s calendar
- **Teams** — belong to several; data stays isolated per membership
- **Shift types** — your templates (work / rest), tap to assign days
- **Offers** — broadcast a shift you need covered; teammates claim
- **Blind swap matching** — request a rest day or slot change; identities stay hidden until accept
- **Privacy defaults** — schedule visibility per membership defaults to `private`

## What it deliberately is not

- Not a time clock
- Not company admin / HR / medical leave tracking
- Not a chat app
- Not Woblip (Woblip is the company-side product)

The Expo demo today is **local-first** (`expo-sqlite`). A Django backend blueprint lives under [`docs/backend/`](./docs/backend/) for when Woflip leaves the local demo — documentation only until implemented.

## Status

Public early product. Mobile clients target iOS/Android via Expo; no App Store listing is claimed in this README.

## Develop

Requires Node + [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm start          # Expo dev server
pnpm ios            # iOS simulator
pnpm android        # Android emulator
pnpm web            # web
pnpm typecheck
pnpm test:run
pnpm lint
```

Useful extras: `pnpm start:tunnel`, `pnpm build:web`, `pnpm i18n:diff`.

## Docs

- [Backend blueprint](./docs/backend/README.md) — product boundaries, stack, delivery order
- [Data model](./docs/backend/data-model.md)
- [API contract](./docs/backend/api.md)

## License

[MIT](./LICENSE)
