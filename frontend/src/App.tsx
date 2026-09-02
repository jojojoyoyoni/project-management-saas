import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ProjectsPage from '@/pages/dashboard/ProjectsPage'
import TasksPage from '@/pages/dashboard/TasksPage'
import LoginPage from '@/pages/auth/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'tasks', element: <TasksPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
