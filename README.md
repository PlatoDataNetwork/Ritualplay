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

# Install backend dependencies
npm install

# Go to the frontend folder and install its dependencies
cd frontend
npm install

# Start the backend from the repo root
cd ..
npm run start:backend

# Start the frontend in a second terminal
npm run start:frontend
```

---

## Project Structure

- `frontend/` - React application deployed to Vercel
- repo root - Express + Socket.IO backend deployed to Railway
- `server.js` - persistent backend entry point for realtime poker
- `app.js` - shared Express app used by server/runtime wrappers
- `socket/` - realtime poker game state and Socket.IO event handling
- `routes/`, `controllers/`, `middleware/`, `models/`, `game/` - backend modules

## Config

- **JWT issuance** – `POST /api/auth` in `controllers/auth.js` signs a JWT with `config.JWT_SECRET_KEY` (see `SESSION_EXPIRES_IN`). The payload only contains `user.id` so you can safely extend it.
- **Client storage** – Tokens are pushed into Axios’ default headers via `frontend/src/helpers/setAuthToken.js`. Persist them in `localStorage`/`sessionStorage` from your auth screen and call `setAuthToken(token)` on boot.
- **Protected routes** – `middleware/auth.js` expects the token in the `x-auth-token` header and injects `req.user`. Use the middleware on any route that needs authenticated identity.

### Runtime Environment

Root `.env` (backend):

- `CPU_MODE=true|false`
- `CPU_DIFFICULTY=easy|normal|pro`

Frontend `.env` (inside `frontend/`):

- `REACT_APP_SERVER_URI=http://localhost:5001` (optional override)

## Deployment Overview

Use two hosts:

- Backend on Railway using the repo root
- Frontend on Vercel using the same repo root plus `vercel.json`

This split is required because the poker backend uses a persistent Socket.IO server and in-memory game state.

## Railway Backend Deployment

Deploy the backend from the repository root. Do not upload only selected files if you can avoid it; connect the full repo and let Railway use the root directory.

Files Railway needs from the repo root:

- `package.json`
- `package-lock.json`
- `railway.json`
- `server.js`
- `app.js`
- `config.js`
- `routes/`
- `controllers/`
- `middleware/`
- `socket/`
- `game/`
- `models/`
- `utils/`

Railway steps:

```bash
# From the repo root
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
```

Important Railway settings:

- Start command: `npm start`
- Health check path: `/healthz`
- Root directory: repo root

Recommended Railway environment variables:

- `NODE_ENV=production`
- `PORT` is provided by Railway automatically
- `CPU_MODE=true`
- `CPU_DIFFICULTY=normal`
- Any database/auth secrets your backend needs

After deployment, copy the public Railway backend URL. Example:

```bash
https://ritualplay-backend.up.railway.app
```

## Vercel Frontend Deployment

The repo includes a root `vercel.json` that makes Vercel build and serve the React app from `frontend/build` at `/`.

What is configured:

- `vercel.json` builds the frontend with `npm install --prefix frontend && npm run build --prefix frontend`
- `/` and other non-API routes resolve to the React SPA
- `/api/*` resolves to a Vercel serverless function backed by the Express app

Required Vercel environment variables:

- `REACT_APP_SERVER_URI`

Recommended value:

- Set `REACT_APP_SERVER_URI` to your Railway backend URL.

Example:

```bash
REACT_APP_SERVER_URI=https://ritualplay-backend.up.railway.app
```

Recommended Vercel settings:

- Framework preset: `Other`
- Root directory: repo root
- Build settings: handled by `vercel.json`

Important limitation:

- Vercel does not support long-running Socket.IO game servers in the same way as a persistent Node host.
- Your poker realtime backend must stay on Railway, Render, Fly.io, EC2, or another persistent host.
- For full gameplay on Vercel frontend, set `REACT_APP_SERVER_URI` to that backend URL.

## End-to-End Deploy Checklist

1. Deploy backend from repo root to Railway.
2. Copy the Railway public URL.
3. Add `REACT_APP_SERVER_URI` in Vercel project environment variables.
4. Redeploy Vercel.
5. Open the Vercel frontend and verify wallet connect reaches `/play`.
6. Verify the frontend connects to the Railway Socket.IO backend.

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

