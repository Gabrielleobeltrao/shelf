import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './lib/i18n'
import { HouseholdSyncProvider } from './lib/householdSync'
import { OfflineBanner } from './components/ui/OfflineBanner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <HouseholdSyncProvider>
          <App />
          <OfflineBanner />
        </HouseholdSyncProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
