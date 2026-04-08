import React from 'react'
import GlobalState from './global/GlobalState'
import { ThemeProvider } from 'styled-components'
import ModalProvider from './modal/ModalProvider'
import theme from '../styles/theme'
import Normalize from '../styles/Normalize'
import GlobalStyles from '../styles/Global'
import { BrowserRouter } from 'react-router-dom'
import WebSocketProvider from './websocket/WebsocketProvider'
import GameState from './game/GameState'
import SolanaWalletProvider from './wallet/SolanaWalletProvider'

const Providers = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <GlobalState>
        <ModalProvider>
          <WebSocketProvider>
            <SolanaWalletProvider>
              <GameState>
                <Normalize />
                <GlobalStyles />
                {children}
              </GameState>
            </SolanaWalletProvider>
          </WebSocketProvider>
        </ModalProvider>
      </GlobalState>
    </ThemeProvider>
  </BrowserRouter>
)

export default Providers
