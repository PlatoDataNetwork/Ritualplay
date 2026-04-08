# RitualPlay

RitualPlay is currently a realtime poker application with a React frontend, an Express backend, and Socket.IO-based table state. The codebase also contains some legacy blockchain-oriented config values and REST auth routes, but the running product today is a virtual-chips poker game, not a live on-chain payment or cashout system.

## What Is Running Today

- Frontend: React app in `frontend/`
- Backend: Express + Socket.IO server from the repo root
- Game model: single-process in-memory poker table state
- Wallet UX: Solana wallet connect via Phantom and Solflare
- Deployment model: frontend on Vercel, backend on Railway

Current production endpoints:

- Frontend: `https://w3ai-relay.vercel.app`
- Backend: `https://ritualplay-production.up.railway.app`
- Backend health: `https://ritualplay-production.up.railway.app/healthz`

## Repository Layout

- `frontend/` - React application and Solana wallet UI
- `server.js` - persistent Node entry point that attaches Socket.IO to Express
- `app.js` - shared Express app setup
- `routes/` - REST API routes
- `controllers/` - REST controller logic
- `socket/` - realtime lobby, table, and gameplay event handling
- `game/` - poker engine classes such as `Table`, `Player`, and deck/action logic
- `models/` - Mongoose models for persisted users
- `scripts/` - utility scripts including multiplayer smoke testing
- `vercel.json` - Vercel frontend build and routing config
- `railway.json` - Railway backend deploy config

## Local Development

Install dependencies:

```bash
npm install
npm install --prefix frontend
```

Run backend and frontend in separate terminals:

```bash
npm run start:backend
npm run start:frontend
```

Or run both together:

```bash
npm run dev
```

Useful commands:

```bash
npm run build:frontend
CI=true npm test -- --watchAll=false --passWithNoTests
npm run smoke:multiuser
```

## Environment

Backend values:

- `PORT` defaults to `5001` locally and is supplied automatically on Railway
- `CPU_MODE=true|false`
- `CPU_DIFFICULTY=easy|normal|pro`
- `INITIAL_CHIPS_AMOUNT` defaults to `10000`

Frontend values:

- `REACT_APP_SERVER_URI` is optional locally
- `REACT_APP_SERVER_URI` is required in production so the Vercel frontend can reach Railway

Local example:

```bash
REACT_APP_SERVER_URI=http://localhost:5001
```

Production example:

```bash
REACT_APP_SERVER_URI=https://ritualplay-production.up.railway.app
```

## Deployment Architecture

This app must be split across two hosts:

- Vercel serves the React frontend
- Railway runs the persistent Node + Socket.IO backend

The reason is simple: poker gameplay depends on long-lived websocket connections and in-memory table state. Vercel Functions are not a good fit for that runtime model.

## Railway Deployment

Deploy the backend from the repository root.

Railway configuration in this repo:

- Start command: `npm start`
- Health check: `/healthz`
- Config file: `railway.json`

CLI flow:

```bash
railway login
railway link
railway up
```

Recommended Railway settings:

- Root directory: repo root
- Environment: `production`
- `NODE_ENV=production`
- `CPU_MODE=true`
- `CPU_DIFFICULTY=normal`

Files Railway needs are the backend files and the root manifest, so the safest approach is to deploy the full repository rather than a partial upload.

## Vercel Deployment

Deploy the frontend from the same repo root. `vercel.json` is already configured to build `frontend/` and publish `frontend/build`.

Important points:

- Framework preset: `Other`
- Root directory: repo root
- `vercel.json` handles the actual build settings
- `REACT_APP_SERVER_URI` must point to the Railway backend URL

CLI flow:

```bash
npx vercel env add REACT_APP_SERVER_URI production
npx vercel env add REACT_APP_SERVER_URI preview
npx vercel --prod --yes
```

## End-to-End Deploy Checklist

1. Deploy the backend on Railway from the repo root.
2. Copy the Railway public domain.
3. Set `REACT_APP_SERVER_URI` in Vercel to that Railway URL.
4. Redeploy Vercel.
5. Open the frontend and connect a wallet.
6. Confirm `/play` connects to the Railway Socket.IO server.
7. Confirm `https://your-backend-url/healthz` returns `{"ok":true}`.

## Application Flow

This section describes the implemented flow, not the aspirational roadmap.

### 1. User Opens The Frontend

- Route `/` renders the wallet entry screen
- The screen uses Solana Wallet Adapter UI
- Supported wallet adapters in the code today are `Phantom` and `Solflare`

### 2. Wallet Connect

- The frontend connects to Solana `mainnet-beta` through the wallet adapter provider
- The connected wallet address is used as the player identity for the live poker session
- No token transfer or signed payment is performed during this step

### 3. Lobby Bootstrap

- Once a wallet is connected, the frontend emits `CS_FETCH_LOBBY_INFO`
- The backend creates or refreshes an in-memory `Player` record keyed by the wallet address
- The player starts with `INITIAL_CHIPS_AMOUNT`, which defaults to `10000`

### 4. Table Join

- The frontend navigates to `/play`
- The page automatically joins table `1`
- If the player is not already seated, the backend places them in the first empty seat and buys them in for the table limit
- If CPU mode is enabled, the backend adds a CPU opponent when needed so the game can start with two active players

### 5. Gameplay

- Gameplay actions are sent over Socket.IO
- Implemented actions include `fold`, `check`, `call`, `raise`, `sit down`, `stand up`, and `rebuy`
- The backend updates table state in memory and broadcasts redacted table views to each player
- When a player’s turn times out, the frontend auto-folds after 15 seconds

### 6. Leave, Stand Up, Disconnect

- Leaving or standing up returns the seat stack back to the player bankroll in memory
- Disconnect removes the player from the live in-memory table state
- Since table state is in memory, a backend restart resets active live table state

## Auth And Identity Model

There are two identity paths in this codebase.

### Wallet-Based Live Gameplay Flow

- This is the flow the current frontend actually uses
- Identity comes from the connected Solana wallet address
- The address is stored in frontend global state and used in socket events
- No JWT is required for the wallet-only poker session flow

### REST Email/Password API Flow

- The backend also exposes classic REST auth endpoints:
- `POST /api/users` registers a user and returns a JWT
- `POST /api/auth` logs in a user and returns a JWT
- `GET /api/auth` returns the current user when `x-auth-token` is present
- `GET /api/chips/free` grants more chips only for an authenticated persisted user whose `chipsAmount <= 0`

This REST auth path exists in the backend, but it is not the primary path surfaced by the current wallet-first frontend.

## Payment, Chips, And Charging Model

This is the most important clarification for anyone deploying or extending the app.

### What Payment Methods Are Supported Right Now

- Solana wallet connect for identity: supported
- Phantom wallet: supported
- Solflare wallet: supported
- Credit card payments: not implemented
- Stripe: not implemented
- PayPal: not implemented
- On-chain token deposits: not implemented
- On-chain withdrawals or cashout: not implemented
- NFT purchases: not implemented in the running app

### What The “Deposit” Button Actually Does

The deposit modal in the poker UI is not a fiat or crypto payment form.

What it does today:

- validates a virtual chip amount between `100` and `100000`
- emits the Socket.IO `CS_REBUY` event
- calls backend `table.rebuyPlayer(seatId, amount)`
- subtracts that amount from the player’s in-memory bankroll
- adds that amount to the player’s current seat stack

What it does not do:

- it does not charge a credit card
- it does not call a blockchain contract
- it does not submit a Solana transaction
- it does not move real money or tokens

### How A User Gets Chips Today

There are two implemented chip sources:

- Initial bankroll on session creation: socket-created players start with `INITIAL_CHIPS_AMOUNT`
- Free-chip refill endpoint: persisted users can call `GET /api/chips/free` only when their stored `chipsAmount` is `0` or below

### How A User Is Charged Today

Users are not charged real money by the current implementation.

The only “charging” behavior that exists today is virtual chip bookkeeping:

- sitting down decreases off-table bankroll by the buy-in amount
- rebuy decreases off-table bankroll by the rebuy amount
- standing up or leaving returns the seat stack to the bankroll

That is internal game-state accounting, not payment processing.

### Blockchain-Related Config In The Repo

`config.js` contains values such as contract addresses and a BSC RPC URL, but the current runtime flow does not invoke those values in gameplay, charging, or settlement. Treat them as unused or future-facing until actual transaction code is implemented.

## Data Persistence And State Limits

- Poker table state is held in process memory inside `socket/index.js`
- Active hands, seats, and live bankroll state are not persisted to a database
- Persisted MongoDB data currently applies to REST users, not the realtime table engine
- Restarting the backend clears active table state

## Realtime Events Overview

Key inbound socket events:

- `CS_FETCH_LOBBY_INFO`
- `CS_JOIN_TABLE`
- `CS_LEAVE_TABLE`
- `CS_SIT_DOWN`
- `CS_REBUY`
- `CS_FOLD`
- `CS_CHECK`
- `CS_CALL`
- `CS_RAISE`
- `CS_STAND_UP`

Key outbound socket events:

- `SC_RECEIVE_LOBBY_INFO`
- `SC_PLAYERS_UPDATED`
- `SC_TABLE_JOINED`
- `SC_TABLE_LEFT`
- `SC_TABLES_UPDATED`
- `SC_TABLE_UPDATED`

## Multiplayer QA

Run the smoke test from the repo root:

```bash
npm run smoke:multiuser
```

Optional tuning:

```bash
SMOKE_PLAYERS=5 SMOKE_BUY_IN=1500 SMOKE_DURATION_MS=30000 npm run smoke:multiuser
```

The smoke script reports table updates, approximate hand starts, and sent actions.

## Developer Notes

- The frontend folder is `frontend/`, not `client/`
- The Vercel frontend depends on a working Railway backend URL in `REACT_APP_SERVER_URI`
- CPU behavior defaults to `normal` if `CPU_DIFFICULTY` is missing or invalid
- The wallet flow is the primary live flow; the REST auth flow is secondary and backend-driven

## Contributing

Before opening a PR:

- ensure the frontend builds
- ensure backend deployment assumptions still match this README
- document any new environment variables
- test on both desktop and mobile when changing gameplay UI

## Confidentiality

This repository is proprietary to Ritual Net.

