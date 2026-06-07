import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { LocaleGate, LocaleHomeRedirect } from '@/i18n'
import Library from '@/pages/Library'
import SceneDetail from '@/pages/SceneDetail'
import LiveScene from '@/pages/LiveScene'
import Debrief from '@/pages/Debrief'
import CreateScene from '@/pages/CreateScene'

const queryClient = new QueryClient()

// The page tree is mounted twice: bare for English (the default locale) and
// under /:locale for everything else (/de/...). Static segments outrank the
// :locale param, so /create and /scene/x keep resolving to the bare branch;
// LocaleGate rejects unknown prefixes and canonicalizes /en/* to bare paths.
const pageRoutes = (): RouteObject[] => [
  { index: true, element: <Library /> },
  { path: 'create', element: <CreateScene /> },
  { path: 'scene/:slug', element: <SceneDetail /> },
  { path: 'scene/:slug/live', element: <LiveScene /> },
  { path: 'scene/:slug/debrief', element: <Debrief /> },
  { path: '*', element: <LocaleHomeRedirect /> },
]

// Data router (createBrowserRouter + RouterProvider) rather than the declarative
// <BrowserRouter>/<Routes>: only the data router wraps navigations in
// document.startViewTransition, so <Link viewTransition> page transitions
// (Library → Detail, Detail → Live) take effect under <RouterProvider>.
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      ...pageRoutes(),
      { path: ':locale', element: <LocaleGate />, children: pageRoutes() },
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
