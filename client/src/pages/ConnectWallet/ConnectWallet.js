import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import globalContext from './../../context/global/globalContext'
import socketContext from '../../context/websocket/socketContext'
import { CS_FETCH_LOBBY_INFO } from '../../game/actions'
import tableImage from '../../assets/game/table.webp'
import backgroundImage from '../../assets/img/background.png'
import cardBackImage from '../../assets/game/card_back.png'
import './ConnectWallet.scss'

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.25rem;
  background: radial-gradient(circle at 52% 30%, rgba(7, 120, 93, 0.3), rgba(4, 8, 14, 0.94) 70%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: -8% -5% auto -5%;
    height: 62%;
    background: url(${tableImage}) center top / contain no-repeat;
    opacity: 0.32;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      url(${cardBackImage}) left 8% top 11% / 92px no-repeat,
      url(${cardBackImage}) right 9% bottom 16% / 92px no-repeat,
      url(${backgroundImage}) center / cover no-repeat;
    opacity: 0.13;
    pointer-events: none;
  }
`

const Card = styled.section`
  width: min(620px, 100%);
  position: relative;
  z-index: 1;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(160deg, rgba(8, 23, 24, 0.93), rgba(7, 11, 16, 0.93));
  backdrop-filter: blur(8px);
  padding: 2rem 1.5rem;
  text-align: center;
  color: #eef5f7;
`

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.7rem, 4.8vw, 2.35rem);
  letter-spacing: 0.01em;
`

const Subtitle = styled.p`
  margin: 0.85rem auto 1.35rem;
  max-width: 40ch;
  color: rgba(238, 245, 247, 0.78);
  line-height: 1.5;
`

const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(77, 214, 180, 0.5);
  color: #b8f5e6;
  padding: 0.28rem 0.75rem;
  font-size: 0.78rem;
  margin-bottom: 0.95rem;
`

const Status = styled.p`
  min-height: 1.25rem;
  margin: 1rem 0 0;
  color: ${({ $error }) => ($error ? '#fda4a4' : 'rgba(238, 245, 247, 0.85)')};
`

const ButtonWrap = styled.div`
  .wallet-adapter-button {
    min-height: 46px;
    border-radius: 12px;
    font-weight: 700;
    background: linear-gradient(180deg, #1aa882, #11715b);
  }

  .wallet-adapter-button:not([disabled]):hover {
    background: linear-gradient(180deg, #23b48e, #15906f);
  }
`

const ConnectWallet = () => {
  const { setWalletAddress } = useContext(globalContext)
  const { socket } = useContext(socketContext)
  const navigate = useNavigate()
  const location = useLocation()
  const { publicKey, connected, connecting } = useWallet()

  const [socketReady, setSocketReady] = useState(false)
  const [error, setError] = useState('')
  const lastHandledAddressRef = useRef('')

  useEffect(() => {
    if (!socket) {
      setSocketReady(false)
      return
    }

    const sync = () => setSocketReady(socket.connected === true)
    sync()
    socket.on('connect', sync)
    socket.on('disconnect', sync)

    return () => {
      socket.off('connect', sync)
      socket.off('disconnect', sync)
    }
  }, [socket])

  useEffect(() => {
    if (!socket || !socketReady || !connected || !publicKey) {
      return
    }

    const walletAddress = publicKey.toBase58()
    if (!walletAddress || lastHandledAddressRef.current === walletAddress) {
      return
    }

    const query = new URLSearchParams(location.search)
    const gameId = query.get('gameId') || 'main'
    const username = query.get('username') || `Player-${walletAddress.slice(0, 4)}${walletAddress.slice(-4)}`

    lastHandledAddressRef.current = walletAddress
    setWalletAddress(walletAddress)
    setError('')
    socket.emit(CS_FETCH_LOBBY_INFO, {
      walletAddress,
      socketId: socket.id,
      gameId,
      username,
    })
    navigate('/play')
  }, [connected, location.search, navigate, publicKey, setWalletAddress, socket, socketReady])

  useEffect(() => {
    if (!socketReady) {
      setError('Connecting to server...')
      return
    }

    if (connected && !publicKey && !connecting) {
      setError('Wallet is connected but public key is not available yet.')
      return
    }

    setError('')
  }, [connected, connecting, publicKey, socketReady])

  return (
    <PageWrapper>
      <Card>
        <Chip>RitualPlay Poker</Chip>
        <Title>Enter The Table</Title>
        <Subtitle>
          Use the Solana Wallet SDK picker to choose your wallet and join instantly.
        </Subtitle>

        <ButtonWrap>
          <WalletMultiButton />
        </ButtonWrap>

        <Status $error={!!error}>{error || (connecting ? 'Opening wallet selector...' : '')}</Status>
      </Card>
    </PageWrapper>
  )
}

export default ConnectWallet
