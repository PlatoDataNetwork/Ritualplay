import React, { useState, useEffect, useContext, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import globalContext from './../../context/global/globalContext'
import socketContext from '../../context/websocket/socketContext'
import { CS_FETCH_LOBBY_INFO } from '../../game/actions'
import { connectToWallet, getInstalledWallets } from '../../utils/interact'
import './ConnectWallet.scss'

/* -------------------------------------------------------------------------- */
/*  Wallet metadata                                                            */
/* -------------------------------------------------------------------------- */
const WALLETS = [
  {
    id: 'phantom',
    name: 'Phantom',
    description: 'The friendly Solana wallet',
    brandColor: '#AB9FF2',
    installUrl: 'https://phantom.app',
  },
  {
    id: 'solflare',
    name: 'Solflare',
    description: 'Power wallet for Solana',
    brandColor: '#FC8029',
    installUrl: 'https://solflare.com',
  },
  {
    id: 'backpack',
    name: 'Backpack',
    description: 'Multi-chain crypto wallet',
    brandColor: '#E33E3F',
    installUrl: 'https://backpack.app',
  },
]

/* -------------------------------------------------------------------------- */
/*  Inline SVG icons — no external URLs, no XSS risk                          */
/* -------------------------------------------------------------------------- */
const PhantomIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#AB9FF2" />
    <path d="M20 8C13.9 8 9 12.9 9 19v9l4.5-3.5 4.5 3.5 4.5-3.5 4.5 3.5V19C27 12.9 22.1 8 20 8z" fill="white" />
    <circle cx="16" cy="19" r="2" fill="#AB9FF2" />
    <circle cx="24" cy="19" r="2" fill="#AB9FF2" />
    <path d="M17 23.5h6" stroke="#AB9FF2" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const SolflareIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#FC8029" />
    <path d="M20 9c-0.5 0-9 7.5-9 13a9 9 0 0018 0C29 16.5 20.5 9 20 9z" fill="white" />
    <path d="M20 15c0 0-4.5 4-4.5 7a4.5 4.5 0 009 0C24.5 19 20 15 20 15z" fill="#FC8029" opacity="0.55" />
  </svg>
)

const BackpackIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#E33E3F" />
    <rect x="12" y="17" width="16" height="14" rx="4" fill="white" />
    <path d="M15.5 17v-2.5a4.5 4.5 0 019 0V17" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <rect x="17.5" y="21" width="5" height="6" rx="2.5" fill="#E33E3F" />
  </svg>
)

const WALLET_ICONS = { phantom: PhantomIcon, solflare: SolflareIcon, backpack: BackpackIcon }

/* -------------------------------------------------------------------------- */
/*  Animations                                                                 */
/* -------------------------------------------------------------------------- */
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`

/* -------------------------------------------------------------------------- */
/*  Styled components                                                          */
/* -------------------------------------------------------------------------- */
const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  background: #080c14;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 20% 30%, rgba(171, 159, 242, 0.07) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 70%, rgba(252, 128, 41, 0.06) 0%, transparent 55%),
                radial-gradient(ellipse at 50% 50%, rgba(0, 255, 255, 0.04) 0%, transparent 60%);
    pointer-events: none;
  }
`

const Card = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 780px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  animation: ${fadeInUp} 0.45s ease both;

  @media (max-width: 480px) {
    padding: 2rem 1.25rem;
    border-radius: 16px;
  }
`

const CardTitle = styled.h1`
  text-align: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
`

const CardSubtitle = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.95rem;
  margin: 0 0 2.5rem;
`

const WalletGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`

const WalletCard = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${({ $color }) => `${$color}33`};
  border-radius: 16px;
  padding: 1.5rem 1rem;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  text-align: center;

  &:hover:not(:disabled) {
    background: ${({ $color }) => `${$color}18`};
    border-color: ${({ $color }) => `${$color}66`};
    transform: translateY(-3px);
    box-shadow: 0 8px 28px ${({ $color }) => `${$color}22`};
  }

  &:focus-visible {
    outline: 2px solid ${({ $color }) => $color};
    outline-offset: 3px;
  }
`

const WalletIconBox = styled.div`
  width: 56px;
  height: 56px;

  svg {
    width: 100%;
    height: 100%;
  }
`

const WalletName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
`

const WalletDesc = styled.span`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.4;
`

const Badge = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  background: ${({ $ok }) => ($ok ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.06)')};
  color: ${({ $ok }) => ($ok ? '#4ade80' : 'rgba(255,255,255,0.35)')};
  border: 1px solid ${({ $ok }) => ($ok ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)')};
`

const ActionLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 1rem;
  border-radius: 8px;
  background: ${({ $ok, $color }) => ($ok ? `${$color}22` : 'transparent')};
  color: ${({ $ok, $color }) => ($ok ? $color : 'rgba(255,255,255,0.4)')};
  border: 1px solid ${({ $ok, $color }) => ($ok ? `${$color}55` : 'rgba(255,255,255,0.15)')};
`

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.38);
  margin-top: 0.25rem;
`

const Dot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  background: ${({ $on }) => ($on ? '#4ade80' : '#f59e0b')};
  box-shadow: 0 0 6px ${({ $on }) => ($on ? '#4ade8066' : '#f59e0b66')};
`

const ErrorBox = styled.div`
  text-align: center;
  color: #f87171;
  font-size: 0.85rem;
  padding: 0.75rem 1rem;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 10px;
  margin-top: 1rem;
  animation: ${fadeInUp} 0.3s ease both;
`

const ConnectingNote = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  margin-top: 0.5rem;
`

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */
const ConnectWallet = () => {
  const { setWalletAddress } = useContext(globalContext)
  const { socket } = useContext(socketContext)
  const navigate = useNavigate()
  const location = useLocation()

  const [installedWallets, setInstalledWallets] = useState([])
  const [connectingWallet, setConnectingWallet] = useState(null)
  const [error, setError] = useState(null)
  const [socketReady, setSocketReady] = useState(false)

  // Detect installed wallets once on mount
  useEffect(() => {
    setInstalledWallets(getInstalledWallets())
  }, [])

  // Track socket connection state
  useEffect(() => {
    if (!socket) return
    const sync = () => setSocketReady(socket.connected === true)
    sync()
    socket.on('connect', sync)
    socket.on('disconnect', sync)
    return () => {
      socket.off('connect', sync)
      socket.off('disconnect', sync)
    }
  }, [socket])

  // Auto-enter lobby when a wallet address is provided via query param
  useEffect(() => {
    if (!socket || !socketReady) return
    const query = new URLSearchParams(location.search)
    const queryAddress =
      query.get('walletAddress') || query.get('publicKey') || query.get('solanaAddress')
    if (!queryAddress) return
    const gameId = query.get('gameId') || 'main'
    const username =
      query.get('username') ||
      `Player-${queryAddress.slice(0, 4)}${queryAddress.slice(-4)}`
    setWalletAddress(queryAddress)
    socket.emit(CS_FETCH_LOBBY_INFO, { walletAddress: queryAddress, socketId: socket.id, gameId, username })
    navigate('/play')
  }, [location.search, navigate, setWalletAddress, socket, socketReady])

  const handleWalletClick = useCallback(
    async (wallet) => {
      if (connectingWallet) return

      const isInstalled = installedWallets.includes(wallet.id)
      if (!isInstalled) {
        window.open(wallet.installUrl, '_blank', 'noopener,noreferrer')
        return
      }

      if (!socketReady) {
        setError('Server not connected. Please wait a moment and try again.')
        return
      }

      setError(null)
      setConnectingWallet(wallet.id)

      const query = new URLSearchParams(location.search)
      const gameId = query.get('gameId') || 'main'
      const result = await connectToWallet(wallet.id)

      if (result.event !== 'connected') {
        setError(result.response || 'Wallet connection failed. Please try again.')
        setConnectingWallet(null)
        return
      }

      const address = result.response
      const username =
        query.get('username') || `Player-${address.slice(0, 4)}${address.slice(-4)}`
      setWalletAddress(address)
      socket.emit(CS_FETCH_LOBBY_INFO, { walletAddress: address, socketId: socket.id, gameId, username })
      navigate('/play')
    },
    [connectingWallet, installedWallets, socketReady, location.search, setWalletAddress, socket, navigate],
  )

  return (
    <PageWrapper>
      <Card>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardSubtitle>Select a Solana wallet to start playing</CardSubtitle>

        <WalletGrid>
          {WALLETS.map((wallet) => {
            const isInstalled = installedWallets.includes(wallet.id)
            const isConnecting = connectingWallet === wallet.id
            const Icon = WALLET_ICONS[wallet.id]
            return (
              <WalletCard
                key={wallet.id}
                $color={wallet.brandColor}
                onClick={() => handleWalletClick(wallet)}
                disabled={!!connectingWallet}
                aria-label={`${isInstalled ? 'Connect with' : 'Install'} ${wallet.name}`}
              >
                <WalletIconBox>
                  <Icon />
                </WalletIconBox>
                <WalletName>{wallet.name}</WalletName>
                <WalletDesc>{wallet.description}</WalletDesc>
                <Badge $ok={isInstalled}>{isInstalled ? '● Installed' : 'Not Installed'}</Badge>
                <ActionLabel $ok={isInstalled} $color={wallet.brandColor}>
                  {isConnecting ? 'Connecting…' : isInstalled ? 'Connect' : 'Install →'}
                </ActionLabel>
              </WalletCard>
            )
          })}
        </WalletGrid>

        {connectingWallet && (
          <ConnectingNote>
            Connecting to {WALLETS.find((w) => w.id === connectingWallet)?.name}…
          </ConnectingNote>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}

        <StatusRow>
          <Dot $on={socketReady} />
          {socketReady ? 'Server connected' : 'Connecting to server…'}
        </StatusRow>
      </Card>
    </PageWrapper>
  )
}

export default ConnectWallet
