import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import Library from '@/pages/Library'
import SceneDetail from '@/pages/SceneDetail'
import LiveScene from '@/pages/LiveScene'
import Debrief from '@/pages/Debrief'
import CreateScene from '@/pages/CreateScene'

const queryClient = new QueryClient()

// Data router (createBrowserRouter + RouterProvider) rather than the declarative
// <BrowserRouter>/<Routes>: only the data router wraps navigations in
// document.startViewTransition, so <Link viewTransition> page transitions
// (Library → Detail, Detail → Live) take effect under <RouterProvider>.
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Library /> },
      { path: 'create', element: <CreateScene /> },
      { path: 'scene/:slug', element: <SceneDetail /> },
      { path: 'scene/:slug/live', element: <LiveScene /> },
      { path: 'scene/:slug/debrief', element: <Debrief /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
