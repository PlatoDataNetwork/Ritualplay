import React, { useState, useEffect, useContext } from 'react'
import SocketContext from './socketContext'
import io from 'socket.io-client'
import {
  CS_DISCONNECT,
  SC_PLAYERS_UPDATED,
  SC_RECEIVE_LOBBY_INFO,
  SC_TABLES_UPDATED,
} from '../../game/actions'
import globalContext from '../global/globalContext'
import config from '../../clientConfig'

const WebSocketProvider = ({ children }) => {
  const { setTables, setPlayers, setChipsAmount } = useContext(globalContext)

  const [socket, setSocket] = useState(null)
  const [socketId, setSocketId] = useState(null)

  useEffect(() => {
    window.addEventListener('beforeunload', cleanUp)
    window.addEventListener('beforeclose', cleanUp)
    return () => {
      window.removeEventListener('beforeunload', cleanUp)
      window.removeEventListener('beforeclose', cleanUp)
      cleanUp()
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    if (!socket) {
      reconnect()
    }
    // eslint-disable-next-line
  }, [socket])

  function cleanUp() {
    if (window.socket) {
      window.socket.emit(CS_DISCONNECT)
      window.socket.removeAllListeners()
      window.socket.close()
      window.socket = null
    }

    setSocket(null)
    setSocketId(null)
    setChipsAmount(null)
    setPlayers(null)
    setTables(null)
  }

  function reconnect() {
    if (window.socket && window.socket.connected) {
      setSocket(window.socket)
      return window.socket
    }

    if (window.socket) {
      window.socket.removeAllListeners()
      window.socket.close()
      window.socket = null
    }

    return connect()
  }

  function connect() {
    const socket = io(config.socketURI, {
      transports: ['websocket'],
      upgrade: false,
    })
    registerCallbacks(socket)
    window.socket = socket
    return socket
  }

  function registerCallbacks(socket) {
    socket.on('connect', () => {
      setSocket(socket)
    })

    socket.on('disconnect', () => {
      setSocket(null)
      setSocketId(null)
    })

    socket.on(SC_RECEIVE_LOBBY_INFO, ({ tables, players, socketId, amount }) => {
      setSocketId(socketId)
      setChipsAmount(amount)
      setTables(tables)
      setPlayers(players)
    })

    socket.on(SC_PLAYERS_UPDATED, (players) => {
      setPlayers(players)
    })

    socket.on(SC_TABLES_UPDATED, (tables) => {
      setTables(tables)
    })

  }

  return (
    <SocketContext.Provider value={{ socket, socketId, cleanUp, reconnect }}>
      {children}
    </SocketContext.Provider>
  )
}

export default WebSocketProvider
