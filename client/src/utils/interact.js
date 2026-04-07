/* -------------------------------------------------------------------------- */
/*  Wallet registry — describes each supported Solana wallet extension         */
/* -------------------------------------------------------------------------- */
const WALLET_REGISTRY = {
  phantom: {
    name: 'Phantom',
    installUrl: 'https://phantom.app',
    getProvider: () => {
      if (typeof window === 'undefined') return null
      if (window.phantom?.solana?.isPhantom) return window.phantom.solana
      if (window.solana?.isPhantom) return window.solana
      return null
    },
  },
  solflare: {
    name: 'Solflare',
    installUrl: 'https://solflare.com',
    getProvider: () => {
      if (typeof window === 'undefined') return null
      return window.solflare?.isSolflare ? window.solflare : null
    },
  },
  backpack: {
    name: 'Backpack',
    installUrl: 'https://backpack.app',
    getProvider: () => {
      if (typeof window === 'undefined') return null
      return window.backpack?.isBackpack ? window.backpack : null
    },
  },
}

/**
 * Returns the IDs of wallet extensions that are currently installed in the
 * browser (e.g. ['phantom', 'backpack']).
 */
export const getInstalledWallets = () => {
  if (typeof window === 'undefined') return []
  return Object.keys(WALLET_REGISTRY).filter(
    (id) => !!WALLET_REGISTRY[id].getProvider(),
  )
}

/**
 * Connect to a specific wallet by its ID ('phantom' | 'solflare' | 'backpack').
 * Returns { event: 'connected', response: publicKeyString } on success.
 */
export const connectToWallet = async (walletId) => {
  const entry = WALLET_REGISTRY[walletId]
  if (!entry) {
    return { event: 'Error', response: 'Unknown wallet.' }
  }

  const provider = entry.getProvider()
  if (!provider) {
    return {
      event: 'Not Installed',
      response: `${entry.name} is not installed.`,
      installUrl: entry.installUrl,
    }
  }

  try {
    const connectResponse = await provider.connect()
    const publicKey = extractPublicKey(provider, connectResponse)
    if (!publicKey) {
      return { event: 'Error', response: 'Unable to read wallet public key.' }
    }
    return { event: 'connected', response: publicKey }
  } catch (error) {
    return {
      event: 'Error',
      response: error?.message || `Failed to connect ${entry.name}.`,
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Legacy helpers kept for backward compatibility                             */
/* -------------------------------------------------------------------------- */
const getPreferredSolanaProvider = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const candidates = [window.solflare, window.backpack, window.phantom, window.solana]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (
      candidate.isSolflare ||
      candidate.isPhantom ||
      candidate.isBackpack ||
      typeof candidate.connect === 'function'
    ) {
      return candidate
    }
  }

  if (Array.isArray(window.navigator?.wallets) && window.navigator.wallets.length > 0) {
    return window.navigator.wallets[0]
  }

  return null
}

const extractPublicKey = (provider, connectResponse) => {
  const key =
    connectResponse?.publicKey ||
    connectResponse?.account?.publicKey ||
    provider?.publicKey ||
    provider?.account?.publicKey ||
    null

  if (!key) {
    return null
  }

  if (typeof key === 'string') {
    return key
  }

  if (typeof key.toString === 'function') {
    return key.toString()
  }

  return null
}

export const connectSolflare = async () => {
  const provider = getPreferredSolanaProvider()

  if (!provider) {
    return {
      event: 'No Wallet',
      response: 'Please install a Solana wallet extension (Solflare, Phantom, or Backpack).',
    }
  }

  try {
    const connectResponse = await provider.connect()
    const publicKey = extractPublicKey(provider, connectResponse)

    if (!publicKey) {
      return { event: 'Error', response: 'Unable to read wallet public key.' }
    }

    return { event: 'connected', response: publicKey }
  } catch (error) {
    return {
      event: 'Error',
      response: error?.message || 'Failed to connect wallet.',
    }
  }
}

// Backward-compatible alias for legacy imports.
export const connectMetamask = connectSolflare
