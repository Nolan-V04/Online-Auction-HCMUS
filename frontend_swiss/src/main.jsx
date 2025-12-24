import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

import { RouterProvider } from "react-router/dom";
import router from '@/routes/router.jsx'
import { LoadingProvider, useLoading } from '@/contexts/LoadingContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { setupLoadingInterceptor as setupApiLoading } from '@/services/account.service'
import { setupLoadingInterceptor as setupAuthLoading } from '@/services/auth.service.js'

import './index.css'

function AppWrapper() {
  const loadingContext = useLoading();

  useEffect(() => {
    setupApiLoading(loadingContext);
    setupAuthLoading(loadingContext);
  }, [loadingContext]);

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoadingProvider>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </LoadingProvider>
  </StrictMode>,
)
