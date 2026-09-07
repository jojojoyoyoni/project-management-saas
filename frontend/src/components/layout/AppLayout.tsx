// import { Outlet } from 'react-router-dom'
// import Sidebar from './Sidebar'
// import Header from './Header'

// export default function AppLayout() {
//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
        
//         {/* Page Content */}
//         <main className="flex-1 overflow-y-auto p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   )
// }

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
      // Save the fetched user to Redux
      dispatch(setCredentials({ user, token: localStorage.getItem('access_token')! }))
    }
  }, [user, dispatch])

  // Show spinner while fetching user on initial load
  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner /></div>

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
