import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './lib/i18n'
import { ThemeProvider } from './lib/theme'
import { HouseholdSyncProvider } from './lib/householdSync'
import { OfflineBanner } from './components/ui/OfflineBanner'
import './lib/pwaInstall' // capture the install prompt as early as possible

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <HouseholdSyncProvider>
            <App />
            <OfflineBanner />
          </HouseholdSyncProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
