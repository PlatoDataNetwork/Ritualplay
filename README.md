# RitualPlay

## Decentralized AI-Powered Multi-Chain Gaming Platform

> **Blockchain Gaming on the Ritual Network**  
> RitualPlay is a gaming platform built on the **Ritual Network**, using decentralized AI. It supports multiple blockchains like **Ethereum (EVM)**, **Solana**, and more. Play-to-Earn (P2E) mechanics let you earn real crypto rewards.

---

## Current Features

- **Decentralized AI**
- **Multi-Chain Support**: Play on **Ethereum (EVM)**, **Solana**, and other supported blockchains. Your assets and rewards can move between chains.
- **Play-to-Earn (P2E)**: Earn real **crypto rewards** while playing. Rewards are powered by the Ritual Network's AI to make payouts fair.
- **NFT Avatars**: Create and use **NFT avatars**, supported on Ethereum, and other networks.
- **On-Chain Game Logic**: All gameplay is controlled by smart contracts.
- **Token Integration**: Stake and earn with native tokens across different blockchains.
- **Mobile and Desktop Ready**: The platform works on both **desktop** and **mobile** devices.

---

## Coming Soon

- **More Games**: New games like **Blackjack**, **Roulette**, **Slots**, and others. All powered by decentralized AI.
- **Tournaments**: Compete in cross-chain tournaments with prize pools. AI will manage the events and rewards.
- **Social Features**: Chat, add friends, and interact with other players across different blockchains.
- **Better P2E**: Improved reward systems that will work across all blockchains with the help of AI.


[![React](https://img.shields.io/badge/React-16.13.1-61dafb?logo=react)](#)
[![Node.js](https://img.shields.io/badge/Node.js-Express-43853d?logo=node.js)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?logo=typescript)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)](#)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black?logo=socket.io)](#)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.1.3-purple?logo=bootstrap)](#)
[![Styled Components](https://img.shields.io/badge/Styled_Components-5.1.1-DB7093?logo=styled-components)](#)
[![Axios](https://img.shields.io/badge/Axios-1.4.0-5A29E4?logo=axios)](#)


## Quick Start

```bash
git clone <git-repository-url>
cd Ritualplay

# Install root dependencies
npm install

# Go to the client folder and install its dependencies
cd client
npm install

# Start
npm start
```

---

## Config

- **JWT issuance** – `POST /api/auth` in `controllers/auth.js` signs a JWT with `config.JWT_SECRET_KEY` (see `SESSION_EXPIRES_IN`). The payload only contains `user.id` so you can safely extend it.
- **Client storage** – Tokens are pushed into Axios’ default headers via `client/src/helpers/setAuthToken.js`. Persist them in `localStorage`/`sessionStorage` from your auth screen and call `setAuthToken(token)` on boot.
- **Protected routes** – `middleware/auth.js` expects the token in the `x-auth-token` header and injects `req.user`. Use the middleware on any route that needs authenticated identity.

### Runtime Environment

Root `.env` (backend):

- `CPU_MODE=true|false`
- `CPU_DIFFICULTY=easy|normal|pro`

Client `.env` (inside `client/`):

- `REACT_APP_SERVER_URI=http://localhost:5001` (optional override)

## Vercel Deployment

This repo now includes a root `vercel.json` that makes Vercel serve the React app from `client/build` at `/` instead of serving the Express root route.

What is configured:

- `vercel.json` builds the client with `npm install --prefix client && npm run build --prefix client`
- `/` and other non-API routes resolve to the React SPA
- `/api/*` resolves to a Vercel serverless function backed by the Express app

Required Vercel environment variables:

- `REACT_APP_SERVER_URI`

Recommended value:

- If you deploy the backend somewhere else: set `REACT_APP_SERVER_URI` to that public backend URL.
- If you only want the React site and basic same-origin API handling: you can omit it and the client falls back to the current origin.

Important limitation:

- Vercel does not support long-running Socket.IO game servers in the same way as a persistent Node host.
- Your poker realtime backend should be deployed to a persistent service such as Railway, Render, Fly.io, EC2, or a VPS.
- For full gameplay on Vercel frontend, set `REACT_APP_SERVER_URI` to that separate backend URL.

Notes:

- CPU behavior defaults to `normal` when `CPU_DIFFICULTY` is missing or invalid.

## Solana Wallet SDK Setup

The auth page uses Solana Wallet Adapter SDK with built-in wallet selection modal.
Supported adapters in this project include:

- Phantom
- Solflare

No WalletConnect project id is required for this flow.

## Multiplayer QA

Run a local multi-user smoke test from repo root:

```bash
npm run smoke:multiuser
```

Optional tuning:

```bash
SMOKE_PLAYERS=5 SMOKE_BUY_IN=1500 SMOKE_DURATION_MS=30000 npm run smoke:multiuser
```

The script reports:

- table updates received
- approximate hand starts
- number of actions sent

It exits with non-zero status if no actions were sent.

## Contributing Guidelines

### Pre-PR Checklist

- [ ] Branch is updated with `main`  
- [ ] No linting errors
- [ ] No stray console logs or unused variables  
- [ ] UI changes tested on desktop and mobile  
- [ ] Added documentation or comments where needed  
- [ ] Any new `.env` variables are documented  

### Pull Request Rules
- Use clear PR titles:
  - `feat: add tournament lobby UI`
- PR description must include:
  - What changed  
  - Why it changed  
  - How to test  
  - Screenshots for UI updates  
- Tag related issues/tasks.

## Confidentiality
This repository is proprietary to **Ritual Net**.

