import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from './providers/query-provider.tsx'
import { NextUIProvider } from "@nextui-org/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NextUIProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </NextUIProvider>
  </StrictMode>,
)
