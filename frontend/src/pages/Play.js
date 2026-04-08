import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react/lib/cjs'
import Container from '../components/layout/Container'
import Button from '../components/buttons/Button'
import gameContext from '../context/game/gameContext'
import socketContext from '../context/websocket/socketContext'
import globalContext from '../context/global/globalContext'
import setAuthToken from '../helpers/setAuthToken'
import PokerTable from '../components/game/PokerTable'
import { RotateDevicePrompt } from '../components/game/RotateDevicePrompt'
import { PositionedUISlot } from '../components/game/PositionedUISlot'
import { PokerTableWrapper } from '../components/game/PokerTableWrapper'
import { Seat } from '../components/game/Seat/Seat'
import { InfoPill } from '../components/game/InfoPill'
import { GameUI } from '../components/game/GameUI'
import { GameStateInfo } from '../components/game/GameStateInfo'
import BrandingImage from '../components/game/BrandingImage'
import PokerCard from '../components/game/PokerCard'
import config from '../clientConfig'
import background from '../assets/img/background.png'
import './Play.scss';

const Play = () => {
  const navigate = useNavigate()
  const { socket, cleanUp } = useContext(socketContext)
  const {
    walletAddress,
    setWalletAddress,
    setId,
    setUserName,
    setEmail,
    setChipsAmount,
    setTables,
    setPlayers,
  } = useContext(globalContext)
  const { connected, disconnect } = useWallet()
  const {
    messages,
    currentTable,
    seatId,
    joinTable,
    leaveTable,
    sitDown,
    standUp,
    fold,
    check,
    call,
    raise,
    rebuy,
  } = useContext(gameContext)


  const [bet, setBet] = useState(0)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('1000')
  const [depositError, setDepositError] = useState('')
  const [depositNotice, setDepositNotice] = useState('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const pendingDepositRef = React.useRef(0)
  const previousSeatStackRef = React.useRef(null)


  useEffect(() => {
    if (!socket || !walletAddress) {
      navigate('/')
      return
    }

    joinTable(1)

    return () => leaveTable()
    // eslint-disable-next-line
  }, [socket, walletAddress])

  useEffect(() => {
    currentTable &&
      (currentTable.callAmount > currentTable.minBet
        ? setBet(currentTable.callAmount)
        : currentTable.pot > 0
          ? setBet(currentTable.minRaise)
          : setBet(currentTable.minBet))
  }, [currentTable])

  useEffect(() => {
  }, [currentTable, seatId])

  useEffect(() => {
    if (!currentTable || !seatId || !currentTable.seats[seatId]) {
      previousSeatStackRef.current = null
      return
    }

    const seat = currentTable.seats[seatId]
    const currentStack = Number(seat.stack || 0)

    if (
      isDepositing &&
      previousSeatStackRef.current !== null &&
      currentStack > previousSeatStackRef.current
    ) {
      setIsDepositing(false)
      setShowDepositModal(false)
      setDepositError('')
      setDepositNotice(`Deposit confirmed. New stack: ${currentStack}`)
      pendingDepositRef.current = 0
    }

    previousSeatStackRef.current = currentStack
  }, [currentTable, seatId, isDepositing])

  useEffect(() => {
    if (!depositNotice) {
      return
    }

    const timer = setTimeout(() => setDepositNotice(''), 8000)
    return () => clearTimeout(timer)
  }, [depositNotice])

  const handleLeave = async () => {
    if (isLeaving) {
      return
    }

    setIsLeaving(true)

    // Keep logout focused on auth/session state, while still notifying server table leave.
    try {
      leaveTable()
    } catch (error) {
      // Continue local cleanup even if leave emit fails.
    }

    try {
      cleanUp()
    } catch (error) {
      // Continue best-effort cleanup.
    }

    setAuthToken()
    setWalletAddress('')
    setId(null)
    setUserName(null)
    setEmail(null)
    setChipsAmount(null)
    setTables(null)
    setPlayers(null)

    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('x-auth-token')
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('user')

    if (connected) {
      try {
        await disconnect()
      } catch (error) {
        // Ignore wallet adapter disconnect failures during forced logout.
      }
    }

    navigate('/')
    setIsLeaving(false)
  }

  const handleDepositOpen = () => {
    if (!currentTable || !seatId || !currentTable.seats[seatId]) {
      window.alert('Please sit down first to buy chips.')
      return
    }

    setDepositAmount('1000')
    setDepositError('')
    setShowDepositModal(true)
  }

  const handleDepositSubmit = () => {
    if (!currentTable || !seatId || !currentTable.seats[seatId]) {
      setDepositError('Please sit down first to deposit chips.')
      return
    }

    const amount = Number(depositAmount)
    if (!Number.isFinite(amount)) {
      setDepositError('Please enter a valid number.')
      return
    }

    if (!Number.isInteger(amount)) {
      setDepositError('Deposit amount must be a whole number.')
      return
    }

    if (amount < 100) {
      setDepositError('Minimum deposit is 100 chips.')
      return
    }

    if (amount > 100000) {
      setDepositError('Maximum deposit per request is 100000 chips.')
      return
    }

    setDepositError('')
    setDepositNotice('Deposit submitted. Waiting for stack sync...')
    pendingDepositRef.current = amount
    setIsDepositing(true)
    rebuy(currentTable.id, seatId, amount)
  }

  return (
    <>
      <RotateDevicePrompt />
      <Container
        fullHeight
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(2, 123, 98, 0.35), rgba(0, 0, 0, 0.88) 65%), url(${background})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center center',
          backgroundAttachment: 'fixed',
          backgroundColor: '#05090f',
        }}
        className="play-area"
      >
        {!config.hasSocketServerConfigured && (
          <div
            style={{
              position: 'absolute',
              inset: '50% auto auto 50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(560px, calc(100vw - 2rem))',
              zIndex: 60,
              padding: '1.5rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(8, 14, 22, 0.92)',
              color: '#eef5f7',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Game server not configured</h2>
            <p style={{ marginBottom: '0.75rem', color: 'rgba(238, 245, 247, 0.82)' }}>
              The frontend is deployed, but realtime poker needs a persistent Socket.IO backend.
            </p>
            <p style={{ marginBottom: 0, color: '#f6c177' }}>
              Set REACT_APP_SERVER_URI in Vercel to your deployed backend URL.
            </p>
          </div>
        )}

        {config.hasSocketServerConfigured && !socket && (
          <div
            style={{
              position: 'absolute',
              inset: '50% auto auto 50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(520px, calc(100vw - 2rem))',
              zIndex: 60,
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(8, 14, 22, 0.9)',
              color: '#eef5f7',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Connecting to game server</h2>
            <p style={{ marginBottom: 0, color: 'rgba(238, 245, 247, 0.82)' }}>
              Waiting for the Socket.IO server to respond.
            </p>
          </div>
        )}

        {config.hasSocketServerConfigured && socket && !currentTable && (
          <div
            style={{
              position: 'absolute',
              inset: '50% auto auto 50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(520px, calc(100vw - 2rem))',
              zIndex: 60,
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(8, 14, 22, 0.9)',
              color: '#eef5f7',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Loading table</h2>
            <p style={{ marginBottom: 0, color: 'rgba(238, 245, 247, 0.82)' }}>
              Connected to the server. Waiting for lobby and table state.
            </p>
          </div>
        )}

        {currentTable && (
          <>
            <PositionedUISlot
              top="2vh"
              left="1.5rem"
              scale="0.65"
              style={{ zIndex: '50' }}
            >
              <Button small secondary onClick={handleLeave} disabled={isLeaving}>
                {isLeaving ? 'Leaving...' : 'Leave'}
              </Button>
            </PositionedUISlot>
            <PositionedUISlot
              top="2vh"
              right="1.5rem"
              scale="0.65"
              style={{ zIndex: '50', display: 'flex', gap: '0.5rem' }}
            >
              <Button small secondary onClick={handleDepositOpen}>
                Deposit
              </Button>
            </PositionedUISlot>
          </>
        )}
        {depositNotice && (
          <PositionedUISlot
            top="8vh"
            right="1.5rem"
            scale="0.6"
            style={{ zIndex: '55' }}
          >
            <InfoPill>{depositNotice}</InfoPill>
          </PositionedUISlot>
        )}

        {showDepositModal && (
          <div className="deposit-modal-backdrop" role="presentation" onClick={() => setShowDepositModal(false)}>
            <div
              className="deposit-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Deposit chips"
              onClick={(event) => event.stopPropagation()}
            >
              <h3>Deposit Chips</h3>
              <p>Min 100 chips, max 100000 chips per request.</p>
              <label htmlFor="deposit-amount">Amount</label>
              <input
                id="deposit-amount"
                type="number"
                min="100"
                max="100000"
                step="1"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
              />
              {depositError && <div className="deposit-error">{depositError}</div>}
              <div className="deposit-actions">
                <Button small secondary onClick={() => setShowDepositModal(false)}>
                  Cancel
                </Button>
                <Button small onClick={handleDepositSubmit} disabled={isDepositing}>
                  {isDepositing ? 'Pending...' : 'Confirm Deposit'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <PokerTableWrapper>
          <PokerTable />
          {currentTable && (
            <>
              <PositionedUISlot
                top="-5%"
                left="0"
                scale="0.55"
                origin="top left"
              >
                <Seat
                  seatNumber={1}
                  currentTable={currentTable}
                  sitDown={sitDown}
                />
              </PositionedUISlot>
              <PositionedUISlot
                top="-5%"
                right="2%"
                scale="0.55"
                origin="top right"
              >
                <Seat
                  seatNumber={2}
                  currentTable={currentTable}
                  sitDown={sitDown}
                />
              </PositionedUISlot>
              <PositionedUISlot
                bottom="15%"
                right="2%"
                scale="0.55"
                origin="bottom right"
              >
                <Seat
                  seatNumber={3}
                  currentTable={currentTable}
                  sitDown={sitDown}
                />
              </PositionedUISlot>
              <PositionedUISlot bottom="8%" scale="0.55" origin="bottom center">
                <Seat
                  seatNumber={4}
                  currentTable={currentTable}
                  sitDown={sitDown}
                />
              </PositionedUISlot>
              <PositionedUISlot
                bottom="15%"
                left="0"
                scale="0.55"
                origin="bottom left"
              >
                <Seat
                  seatNumber={5}
                  currentTable={currentTable}
                  sitDown={sitDown}
                />
              </PositionedUISlot>
              <PositionedUISlot
                top="-25%"
                scale="0.55"
                origin="top center"
                style={{ zIndex: '1' }}
              >
                <BrandingImage></BrandingImage>
              </PositionedUISlot>
              <PositionedUISlot
                width="100%"
                origin="center center"
                scale="0.60"
                style={{
                  display: 'flex',
                  textAlign: 'center',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {currentTable.board && currentTable.board.length > 0 && (
                  <>
                    {currentTable.board.map((card, index) => (
                      <PokerCard key={index} card={card} />
                    ))}
                  </>
                )}
              </PositionedUISlot>
              <PositionedUISlot top="-5%" scale="0.60" origin="bottom center">
                {messages && messages.length > 0 && (
                  <>
                    <InfoPill>{messages[messages.length - 1]}</InfoPill>
                    {currentTable.winMessages.length > 0 && (
                      <InfoPill>
                        {
                          currentTable.winMessages[
                          currentTable.winMessages.length - 1
                          ]
                        }
                      </InfoPill>
                    )}
                  </>
                )}
              </PositionedUISlot>
              <PositionedUISlot top="12%" scale="0.60" origin="center center">
                {currentTable.winMessages.length === 0 && (
                  <GameStateInfo currentTable={currentTable} />
                )}
              </PositionedUISlot>
            </>
          )}
        </PokerTableWrapper>

        {currentTable &&
          currentTable.seats[seatId] &&
          currentTable.seats[seatId].turn && (
            <GameUI
              currentTable={currentTable}
              seatId={seatId}
              bet={bet}
              setBet={setBet}
              raise={raise}
              standUp={standUp}
              fold={fold}
              check={check}
              call={call}
            />
          )}
      </Container>
    </>
  )
}

export default Play
