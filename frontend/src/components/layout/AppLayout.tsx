import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useCurrentUser } from '@/api/hooks/useAuth'
import { setCredentials } from '@/store/slices/authSlice'
import Sidebar from './Sidebar'
import Header from './Header'
import Spinner from '@/components/common/Spinner'

export default function AppLayout() {
  const dispatch = useDispatch()
  const { data: user, isLoading } = useCurrentUser()

  useEffect(() => {
    if (user) {
      dispatch(setCredentials({ user, token: localStorage.getItem('access_token')! }))
    }
  }, [user, dispatch])

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Wrap Sidebar in a print:hidden div */}
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Wrap Header in a print:hidden div */}
        <div className="print:hidden">
          <Header />
        </div>
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}