import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SaveErrorBanner from './components/SaveErrorBanner'
import { GameProvider } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <SaveErrorBanner />
      <App />
    </GameProvider>
  </StrictMode>,
)
