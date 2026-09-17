import { Fragment, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Listbox, Transition } from '@headlessui/react'
import clsx from 'clsx'
import { FaHouse, FaFolderOpen, FaListCheck, FaGear, FaBolt, FaChevronDown, FaPlus, FaBuilding, FaUserShield } from 'react-icons/fa6'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { useAppDispatch, useAppSelector } from '@/store'
import { setActiveOrganization } from '@/store/slices/orgSlice'
import { useQueryClient } from '@tanstack/react-query'
import CreateOrganizationModal from '@/components/organizations/CreateOrganizationModal'
import UpdateOrganizationModal from '@/components/organizations/UpdateOrganizationModal'
import Modal from '../common/Modal'

export default function Sidebar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeOrgId = useAppSelector((state) => state.org.activeOrganizationId)
  const { data: organizations = [] } = useOrganizations()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  
  const { user } = useAppSelector((state) => state.auth)
  const ownsAnOrganization = organizations.some((org) => org.owner === user?.id || org.is_owner === true)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FaHouse },
    { name: 'Projects', href: '/projects', icon: FaFolderOpen },
    { name: 'My Tasks', href: '/tasks', icon: FaListCheck },
    { name: 'Team', href: '/organization/team', icon: FaUserShield },
    { name: 'Settings', href: '/settings', icon: FaGear },
    ...(user?.is_superuser ? [
      { name: 'Admin Users', href: '/admin/users', icon: FaUserShield },
      { name: 'Admin Orgs', href: '/admin/organizations', icon: FaBuilding }
    ] : [])
  ]

  const activeOrg = organizations.find((org) => org.id === activeOrgId) || organizations[0]

  const handleOrgChange = (orgId: string) => {
    dispatch(setActiveOrganization(orgId))
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    navigate('/projects')
  }

  return (
    <aside className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen">
      {/* Logo Header */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <FaBolt className="text-indigo-600 text-2xl mr-2" />
        <span className="text-xl font-bold text-gray-900 dark:text-white">ProjectFlow</span>
      </div>

      {/* Organization Switcher & Settings Gear */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {organizations.length > 0 ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Listbox value={activeOrg?.id || ''} onChange={handleOrgChange}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-100 dark:bg-gray-700 py-2.5 pl-2 pr-10 text-left text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center">
                    <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2 overflow-hidden flex-shrink-0">
                      {activeOrg?.logo ? (
                        <img src={activeOrg.logo} alt={activeOrg.name} className="w-full h-full object-cover" />
                      ) : (
                        <FaBuilding className="h-3 w-3" />
                      )}
                    </div>
                    <span className="block truncate">{activeOrg?.name || 'Select Organization'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>

                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                      {organizations.map((org) => (
                        <Listbox.Option
                          key={org.id}
                          className={({ active }) =>
                            clsx(
                              'relative cursor-pointer select-none py-2 pl-2 pr-9 flex items-center', 
                              active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-100'
                            )
                          }
                          value={org.id}
                        >
                          <div className={clsx(
                            "w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold mr-2 overflow-hidden flex-shrink-0",
                            org.logo ? '' : 'bg-indigo-500'
                          )}>
                            {org.logo ? (
                              <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                            ) : (
                              <FaBuilding className="h-3 w-3" />
                            )}
                          </div>
                          <span className={clsx('block truncate', org.id === activeOrgId && 'font-semibold')}>
                            {org.name}
                          </span>
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Update Organization Gear Icon */}
            <button 
              onClick={() => setIsUpdateModalOpen(true)}
              className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex-shrink-0"
              title="Update Organization"
            >
              <FaGear className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            Create Organization
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )
            }
          >
            <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* New Organization Button (Only at the bottom) */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {!ownsAnOrganization && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <FaPlus className="h-4 w-4" />
            New Organization
          </button>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Organization">
        <CreateOrganizationModal onClose={() => setIsCreateModalOpen(false)} />
      </Modal>

      {activeOrg && (
        <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Update Organization">
          <UpdateOrganizationModal 
            orgId={activeOrg.id} 
            currentName={activeOrg.name} 
            currentDescription={activeOrg.description} 
            currentLogo={activeOrg.logo}
            onClose={() => setIsUpdateModalOpen(false)} 
          />
        </Modal>
      )}
    </aside>
  )
}