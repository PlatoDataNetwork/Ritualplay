import React, { useMemo } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react/lib/cjs'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui/lib/cjs'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom/lib/cjs'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare/lib/cjs'
import '@solana/wallet-adapter-react-ui/styles.css'

const SolanaWalletProvider = ({ children }) => {
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), [])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default SolanaWalletProvider
