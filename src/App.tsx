import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import Scenarios from '@/pages/Scenarios'
import Session from '@/pages/Session'
import History from '@/pages/History'
import Conversation from '@/pages/Conversation'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Scenarios />} />
              <Route path="session/:scenarioId" element={<Session />} />
              <Route path="history" element={<History />} />
              <Route path="history/:conversationId" element={<Conversation />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
