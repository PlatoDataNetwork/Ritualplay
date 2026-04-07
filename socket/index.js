const Table = require('../game/Table');
const Player = require('../game/Player');
const config = require('../config');

const {
  CS_FETCH_LOBBY_INFO,
  SC_RECEIVE_LOBBY_INFO,
  SC_PLAYERS_UPDATED,
  CS_JOIN_TABLE,
  SC_TABLE_JOINED,
  SC_TABLES_UPDATED,
  CS_LEAVE_TABLE,
  SC_TABLE_LEFT,
  CS_FOLD,
  CS_CHECK,
  CS_CALL,
  CS_RAISE,
  TABLE_MESSAGE,
  CS_SIT_DOWN,
  CS_REBUY,
  CS_STAND_UP,
  SITTING_OUT,
  SITTING_IN,
  CS_DISCONNECT,
  SC_TABLE_UPDATED,
  WINNER,
  CS_LOBBY_CONNECT,
  CS_LOBBY_DISCONNECT,
  SC_LOBBY_CONNECTED,
  SC_LOBBY_DISCONNECTED,
  SC_LOBBY_CHAT,
  CS_LOBBY_CHAT,
} = require('../game/actions');

// State
const tables = {
  1: new Table(1, 'Table 1', config.INITIAL_CHIPS_AMOUNT),
};

const players = {};
const cpuActionTimers = {};

const CPU_MODE_ENABLED = process.env.CPU_MODE !== 'false';
const CPU_DIFFICULTY = (process.env.CPU_DIFFICULTY || 'normal').toLowerCase();
const CPU_DIFFICULTY_PROFILES = {
  easy: {
    delayMinMs: 1300,
    delayMaxMs: 2200,
    checkRaiseChance: 0.12,
    callRaiseChance: 0.08,
    foldPressureThreshold: 0.42,
    foldChanceUnderPressure: 0.6,
    raiseUnitMin: 2,
    raiseUnitMax: 3,
  },
  normal: {
    delayMinMs: 900,
    delayMaxMs: 1700,
    checkRaiseChance: 0.22,
    callRaiseChance: 0.15,
    foldPressureThreshold: 0.58,
    foldChanceUnderPressure: 0.5,
    raiseUnitMin: 3,
    raiseUnitMax: 4,
  },
  pro: {
    delayMinMs: 650,
    delayMaxMs: 1200,
    checkRaiseChance: 0.28,
    callRaiseChance: 0.2,
    foldPressureThreshold: 0.74,
    foldChanceUnderPressure: 0.38,
    raiseUnitMin: 4,
    raiseUnitMax: 6,
  },
};
const CPU_PROFILE = CPU_DIFFICULTY_PROFILES[CPU_DIFFICULTY] || CPU_DIFFICULTY_PROFILES.normal;



// Helpers
const isCpuPlayer = (player) =>
  !!player && typeof player.id === 'string' && player.id.startsWith('cpu:');

const getCurrentPlayers = () =>
  Object.values(players)
    .filter((player) => !isCpuPlayer(player))
    .map(({ socketId, id, name }) => ({ socketId, id, name }));

const getCurrentTables = () =>
  Object.values(tables).map(({ id, name, limit, maxPlayers, players, minBet }) => ({
    id,
    name,
    limit,
    maxPlayers,
    currentNumberPlayers: players.filter((player) => !isCpuPlayer(player)).length,
    smallBlind: minBet,
    bigBlind: minBet * 2,
  }));



// Core
const init = (socket, io) => {
  const findFirstEmptySeatId = (table) => {
    for (let i = 1; i <= table.maxPlayers; i++) {
      if (!table.seats[i]) {
        return i;
      }
    }

    return null;
  };

  const buildCpuPlayer = (table) => {
    const botNumber = Object.values(table.seats).filter((seat) => seat && isCpuPlayer(seat.player)).length + 1;
    const socketId = `cpu-socket:${table.id}:${Date.now()}:${Math.floor(Math.random() * 1000)}`;
    return new Player(
      socketId,
      `cpu:${table.id}:${botNumber}`,
      `CPU Bot ${botNumber}`,
      config.INITIAL_CHIPS_AMOUNT,
    );
  };

  const ensureCpuOpponent = (table) => {
    if (!CPU_MODE_ENABLED || !table) {
      return;
    }

    const humanSeats = Object.values(table.seats).filter((seat) => seat && !isCpuPlayer(seat.player));
    const cpuSeats = Object.values(table.seats).filter((seat) => seat && isCpuPlayer(seat.player));

    if (humanSeats.length === 0) {
      cpuSeats.forEach((seat) => {
        delete players[seat.player.socketId];
        table.removePlayer(seat.player.socketId);
      });
      return;
    }

    if (cpuSeats.length > 0) {
      return;
    }

    const emptySeatId = findFirstEmptySeatId(table);
    if (!emptySeatId) {
      return;
    }

    const cpuPlayer = buildCpuPlayer(table);
    players[cpuPlayer.socketId] = cpuPlayer;
    table.addPlayer(cpuPlayer);
    table.sitPlayer(cpuPlayer, emptySeatId, table.limit);
  };

  const maybeActForCpu = (table) => {
    if (!CPU_MODE_ENABLED || !table || table.handOver || !table.turn) {
      return;
    }

    const seat = table.seats[table.turn];
    if (!seat || !isCpuPlayer(seat.player)) {
      return;
    }

    const randomBetween = (min, max) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    clearTimeout(cpuActionTimers[table.id]);
    cpuActionTimers[table.id] = setTimeout(() => {
      const currentSeat = table.seats[table.turn];
      if (!currentSeat || !isCpuPlayer(currentSeat.player) || table.handOver) {
        return;
      }

      const amountToCall = Math.max(0, (table.callAmount || 0) - currentSeat.bet);
      let result = null;

      if (amountToCall === 0) {
        const raiseUnits = randomBetween(CPU_PROFILE.raiseUnitMin, CPU_PROFILE.raiseUnitMax);
        const shouldRaise = Math.random() < CPU_PROFILE.checkRaiseChance && currentSeat.stack > table.minBet * raiseUnits;
        if (shouldRaise) {
          const targetRaise = Math.min(
            currentSeat.stack + currentSeat.bet,
            Math.max(table.minRaise, currentSeat.bet + table.minBet * raiseUnits),
          );
          if (targetRaise > currentSeat.bet) {
            result = table.handleRaise(currentSeat.player.socketId, targetRaise);
          }
        }

        if (!result) {
          result = table.handleCheck(currentSeat.player.socketId);
        }
      } else {
        const pressure = amountToCall / Math.max(currentSeat.stack, 1);
        const raiseUnits = randomBetween(CPU_PROFILE.raiseUnitMin, CPU_PROFILE.raiseUnitMax);
        const shouldFold =
          pressure > CPU_PROFILE.foldPressureThreshold &&
          Math.random() < CPU_PROFILE.foldChanceUnderPressure;
        const shouldRaise =
          !shouldFold &&
          Math.random() < CPU_PROFILE.callRaiseChance &&
          currentSeat.stack > amountToCall + table.minBet * raiseUnits;

        if (shouldFold) {
          result = table.handleFold(currentSeat.player.socketId);
        } else if (shouldRaise) {
          const targetRaise = Math.min(
            currentSeat.stack + currentSeat.bet,
            Math.max(table.minRaise, (table.callAmount || 0) + table.minBet * raiseUnits),
          );
          if (targetRaise > (table.callAmount || 0)) {
            result = table.handleRaise(currentSeat.player.socketId, targetRaise);
          }
        }

        if (!result) {
          result = table.handleCall(currentSeat.player.socketId);
        }
      }

      if (result) {
        broadcastToTable(table, result.message);
        changeTurnAndBroadcast(table, result.seatId);
      }
    }, randomBetween(CPU_PROFILE.delayMinMs, CPU_PROFILE.delayMaxMs));
  };


  /** LOBBY EVENTS **/

  socket.on(CS_LOBBY_CONNECT, ({ gameId, address, userInfo }) => {
    socket.join(gameId);
    io.to(gameId).emit(SC_LOBBY_CONNECTED, { address, userInfo });
    console.log(SC_LOBBY_CONNECTED, address, socket.id);
  });

  socket.on(CS_LOBBY_DISCONNECT, ({ gameId, address, userInfo }) => {
    io.to(gameId).emit(SC_LOBBY_DISCONNECTED, { address, userInfo });
    console.log(CS_LOBBY_DISCONNECT, address, socket.id);
  });

  socket.on(CS_LOBBY_CHAT, ({ gameId, text, userInfo }) => {
    io.to(gameId).emit(SC_LOBBY_CHAT, { text, userInfo });
  });

  socket.on(CS_FETCH_LOBBY_INFO, ({ walletAddress, socketId, gameId, username }) => {
    if (!walletAddress || !socketId) return;

    const existing = Object.values(players).find(p => p.id === walletAddress);

    if (existing) {
      delete players[existing.socketId];
      Object.values(tables).forEach(table => {
        table.removePlayer(existing.socketId);
        broadcastToTable(table);
      });
    }

    players[socketId] = new Player(
      socketId,
      walletAddress,
      username || `Player-${String(walletAddress).slice(0, 8)}`,
      config.INITIAL_CHIPS_AMOUNT,
    );

    socket.emit(SC_RECEIVE_LOBBY_INFO, {
      tables: getCurrentTables(),
      players: getCurrentPlayers(),
      socketId: socket.id,
      amount: config.INITIAL_CHIPS_AMOUNT
    });

    socket.broadcast.emit(SC_PLAYERS_UPDATED, getCurrentPlayers());
  });

  /** TABLE JOIN/LEAVE **/

  socket.on(CS_JOIN_TABLE, (tableId) => {
    const table = tables[tableId];
    const player = players[socket.id];

    if (!table || !player) {
      return;
    }

    console.log("Joining table:", tableId, table, player);

    if (!table.players.find((p) => p && p.socketId === socket.id)) {
      table.addPlayer(player);
    }

    socket.emit(SC_TABLE_JOINED, { tables: getCurrentTables(), tableId });
    socket.broadcast.emit(SC_TABLES_UPDATED, getCurrentTables());

    if (!findSeatBySocketId(socket.id)) {
      const emptySeatId = findFirstEmptySeatId(table);
      if (emptySeatId) {
        sitDown(tableId, emptySeatId, table.limit);
      }
    }

    if (player && table.players.length > 0) {
      broadcastToTable(table, `${player.name} joined the table.`);
    }
  });

  socket.on(CS_LEAVE_TABLE, (tableId) => {
    const table = tables[tableId];
    const player = players[socket.id];

    if (!table || !player) {
      return;
    }

    const seat = findSeatBySocketId(socket.id);
    if (seat && player) updatePlayerBankroll(player, seat.stack);

    table.removePlayer(socket.id);
    ensureCpuOpponent(table);

    socket.emit(SC_TABLE_LEFT, { tables: getCurrentTables(), tableId });
    socket.broadcast.emit(SC_TABLES_UPDATED, getCurrentTables());

    if (player && table.players.length > 0) {
      broadcastToTable(table, `${player.name} left the table.`);
    }

    if (table.activePlayers().length === 1) {
      clearForOnePlayer(table);
    }
  });

  /** GAMEPLAY EVENTS **/

  socket.on(CS_FOLD, (tableId) => {
    const table = tables[tableId];
    if (!table) return;
    const result = table.handleFold(socket.id);
    if (result) {
      broadcastToTable(table, result.message);
      changeTurnAndBroadcast(table, result.seatId);
    }
  });

  socket.on(CS_CHECK, (tableId) => {
    const table = tables[tableId];
    if (!table) return;
    const result = table.handleCheck(socket.id);
    if (result) {
      broadcastToTable(table, result.message);
      changeTurnAndBroadcast(table, result.seatId);
    }
  });

  socket.on(CS_CALL, (tableId) => {
    const table = tables[tableId];
    if (!table) return;
    const result = table.handleCall(socket.id);
    if (result) {
      broadcastToTable(table, result.message);
      changeTurnAndBroadcast(table, result.seatId);
    }
  });

  socket.on(CS_RAISE, ({ tableId, amount }) => {
    const table = tables[tableId];
    if (!table) return;
    const result = table.handleRaise(socket.id, amount);
    if (result) {
      broadcastToTable(table, result.message);
      changeTurnAndBroadcast(table, result.seatId);
    }
  });

  socket.on(TABLE_MESSAGE, ({ message, from, tableId }) => {
    const table = tables[tableId];
    if (!table) return;
    broadcastToTable(table, message, from);
  });


  /** CHIPS AND SEATING **/

  const sitDown = (tableId, seatId, amount) => {
    const table = tables[tableId];
    const player = players[socket.id];
    if (!table || !player) return;

    table.sitPlayer(player, seatId, amount);
    updatePlayerBankroll(player, -amount);
    ensureCpuOpponent(table);
    broadcastToTable(table, `${player.name} sat down in Seat ${seatId}`);

    if (table.activePlayers().length === 2) {
      initNewHand(table);
    }
  };

  socket.on(CS_SIT_DOWN, ({ tableId, seatId, amount }) => {
    if (!tableId || !seatId || !amount) {
      return;
    }

    sitDown(tableId, seatId, amount);
  });

  socket.on(CS_REBUY, ({ tableId, seatId, amount }) => {
    const table = tables[tableId];
    const player = players[socket.id];

    if (!table || !player) {
      return;
    }

    table.rebuyPlayer(seatId, amount);
    updatePlayerBankroll(player, -amount);
    broadcastToTable(table);
  });

  socket.on(CS_STAND_UP, (tableId) => {
    const table = tables[tableId];
    const player = players[socket.id];
    if (!table || !player) return;
    const seat = findSeatBySocketId(socket.id);

    if (seat) {
      updatePlayerBankroll(player, seat.stack);
      broadcastToTable(table, `${player.name} left the table`);
    }

    table.standPlayer(socket.id);
    ensureCpuOpponent(table);

    if (table.activePlayers().length === 1) {
      clearForOnePlayer(table);
    }
  });

  socket.on(SITTING_OUT, ({ tableId, seatId }) => {
    tables[tableId].seats[seatId].sittingOut = true;
    broadcastToTable(tables[tableId]);
  });

  socket.on(SITTING_IN, ({ tableId, seatId }) => {
    const table = tables[tableId];
    table.seats[seatId].sittingOut = false;
    broadcastToTable(table);

    if (table.handOver && table.activePlayers().length === 2) {
      initNewHand(table);
    }
  });


  /** DISCONNECT **/

  socket.on(CS_DISCONNECT, () => {
    const seat = findSeatBySocketId(socket.id);
    if (seat) updatePlayerBankroll(seat.player, seat.stack);

    delete players[socket.id];
    removeFromTables(socket.id);

    socket.broadcast.emit(SC_TABLES_UPDATED, getCurrentTables());
    socket.broadcast.emit(SC_PLAYERS_UPDATED, getCurrentPlayers());
  });

  /** UTILITY FUNCTIONS **/

  const updatePlayerBankroll = (player, amount) => {
    if (!player) return;
    player.bankroll += amount;
    io.to(socket.id).emit(SC_PLAYERS_UPDATED, getCurrentPlayers());
  };

  const findSeatBySocketId = (socketId) => {
    for (const table of Object.values(tables)) {
      for (const seat of Object.values(table.seats)) {
        if (seat?.player?.socketId === socketId) return seat;
      }
    }
    return null;
  };

  const removeFromTables = (socketId) => {
    Object.values(tables).forEach((table) => {
      table.removePlayer(socketId);
      ensureCpuOpponent(table);
    });
  };

  const broadcastToTable = (table, message = null, from = null) => {
    for (const player of table.players) {
      if (isCpuPlayer(player)) {
        continue;
      }

      const tableView = hideOpponentCards(table, player.socketId);
      io.to(player.socketId).emit(SC_TABLE_UPDATED, {
        table: tableView,
        message,
        from,
      });
    }
  };

  const changeTurnAndBroadcast = (table, seatId) => {
    setTimeout(() => {
      table.changeTurn(seatId);
      broadcastToTable(table);
      if (table.handOver) initNewHand(table);
      maybeActForCpu(table);
    }, 1000);
  };

  const initNewHand = (table) => {
    if (table.activePlayers().length > 1) {
      broadcastToTable(table, '--- New hand starting in 5 seconds ---');
    }

    setTimeout(() => {
      table.clearWinMessages();
      table.startHand();
      broadcastToTable(table, '--- New hand started ---');
      maybeActForCpu(table);
    }, 5000);
  };

  const clearForOnePlayer = (table) => {
    table.clearWinMessages();

    setTimeout(() => {
      table.clearSeatHands();
      table.resetBoardAndPot();
      broadcastToTable(table, 'Waiting for more players');
    }, 5000);
  };

  const hideOpponentCards = (table, socketId) => {
    const hiddenCard = { suit: 'hidden', rank: 'hidden' };
    const hiddenHand = [hiddenCard, hiddenCard];
    const copy = JSON.parse(JSON.stringify(table));

    for (let i = 1; i <= copy.maxPlayers; i++) {
      const seat = copy.seats[i];
      if (
        seat &&
        seat.hand.length &&
        seat.player.socketId !== socketId &&
        !(seat.lastAction === WINNER && copy.wentToShowdown)
      ) {
        seat.hand = hiddenHand;
      }
    }

    return copy;
  };
};

module.exports = { init };