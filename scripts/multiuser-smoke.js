/* eslint-disable no-console */
const io = require('socket.io-client');

const SERVER_URL = process.env.SMOKE_SERVER_URL || 'http://localhost:5001';
const PLAYERS = Number(process.env.SMOKE_PLAYERS || 3);
const BUY_IN = Number(process.env.SMOKE_BUY_IN || 1000);
const DURATION_MS = Number(process.env.SMOKE_DURATION_MS || 25000);

const EVENTS = {
  CS_FETCH_LOBBY_INFO: 'CS_FETCH_LOBBY_INFO',
  CS_JOIN_TABLE: 'CS_JOIN_TABLE',
  CS_SIT_DOWN: 'CS_SIT_DOWN',
  CS_FOLD: 'CS_FOLD',
  CS_CHECK: 'CS_CHECK',
  CS_CALL: 'CS_CALL',
  SC_TABLE_UPDATED: 'SC_TABLE_UPDATED',
};

const players = [];
const tableStats = {
  updates: 0,
  handsSeen: 0,
  actionsSent: 0,
};

const getWallet = (index) => `smoke-wallet-${index}-${Date.now()}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chooseAction = (seat, table) => {
  const callAmount = Number(table.callAmount || 0);
  const toCall = Math.max(0, callAmount - Number(seat.bet || 0));

  if (toCall <= 0) {
    return EVENTS.CS_CHECK;
  }

  const stack = Number(seat.stack || 0);
  if (toCall > stack * 0.65) {
    return Math.random() < 0.4 ? EVENTS.CS_CALL : EVENTS.CS_FOLD;
  }

  return EVENTS.CS_CALL;
};

const wirePlayer = (index) => {
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false,
  });

  const username = `Smoke-${index + 1}`;
  const walletAddress = getWallet(index + 1);

  const state = {
    socket,
    username,
    walletAddress,
    seatId: null,
    actedTurns: new Set(),
  };

  socket.on('connect', () => {
    socket.emit(EVENTS.CS_FETCH_LOBBY_INFO, {
      walletAddress,
      socketId: socket.id,
      gameId: 'main',
      username,
    });

    socket.emit(EVENTS.CS_JOIN_TABLE, 1);
    socket.emit(EVENTS.CS_SIT_DOWN, {
      tableId: 1,
      seatId: index + 1,
      amount: BUY_IN,
    });
  });

  socket.on(EVENTS.SC_TABLE_UPDATED, ({ table }) => {
    if (!table) return;

    tableStats.updates += 1;
    if (Array.isArray(table.board) && table.board.length === 0 && table.pot > 0) {
      tableStats.handsSeen += 1;
    }

    const mySeat = Object.values(table.seats || {}).find(
      (seat) => seat && seat.player && seat.player.socketId === socket.id,
    );

    if (!mySeat) return;

    state.seatId = mySeat.id;
    const turnKey = `${table.turn}-${table.pot}-${table.board.length}`;

    if (!mySeat.turn || state.actedTurns.has(turnKey)) {
      return;
    }

    state.actedTurns.add(turnKey);
    const action = chooseAction(mySeat, table);

    socket.emit(action, table.id);
    tableStats.actionsSent += 1;
  });

  socket.on('connect_error', (error) => {
    console.error(`[${username}] connect error:`, error.message);
  });

  players.push(state);
};

const run = async () => {
  console.log(`Running smoke test on ${SERVER_URL}`);
  console.log(`Players: ${PLAYERS}, buy-in: ${BUY_IN}, duration: ${DURATION_MS}ms`);

  for (let i = 0; i < PLAYERS; i++) {
    wirePlayer(i);
    await sleep(150);
  }

  await sleep(DURATION_MS);

  players.forEach(({ socket }) => {
    if (socket.connected) {
      socket.disconnect();
    }
  });

  console.log('Smoke test summary:');
  console.log(`- Table updates received: ${tableStats.updates}`);
  console.log(`- Approx hand-start snapshots: ${tableStats.handsSeen}`);
  console.log(`- Actions sent by bots: ${tableStats.actionsSent}`);

  if (tableStats.actionsSent === 0) {
    console.error('No actions were sent. Check server and socket event flow.');
    process.exit(1);
  }

  process.exit(0);
};

run().catch((error) => {
  console.error('Smoke test failed:', error);
  process.exit(1);
});
