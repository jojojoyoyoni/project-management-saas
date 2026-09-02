import { Fragment } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Listbox, Transition } from '@headlessui/react'
import clsx from 'clsx'
import { FaHouse, FaFolderOpen, FaListCheck, FaGear, FaBolt, FaChevronDown } from 'react-icons/fa6'
import { useOrganizations } from '@/api/hooks/useOrganizations'
import { useAppDispatch, useAppSelector } from '@/store'
import { setActiveOrganization } from '@/store/slices/orgSlice'

const navigation = [
  { name: 'Dashboard', href: '/', icon: FaHouse },
  { name: 'Projects', href: '/projects', icon: FaFolderOpen },
  { name: 'My Tasks', href: '/tasks', icon: FaListCheck },
  { name: 'Settings', href: '/settings', icon: FaGear },
]

export default function Sidebar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const activeOrgId = useAppSelector((state) => state.org.activeOrganizationId)
  const { data: organizations = [] } = useOrganizations()

  const activeOrg = organizations.find((org) => org.id === activeOrgId) || organizations[0]

  const handleOrgChange = (orgId: string) => {
    dispatch(setActiveOrganization(orgId))
    navigate(0)
  }

  return (
    // Changed 'hidden lg:flex' to just 'flex' to force it to show
    <aside className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <FaBolt className="text-indigo-600 text-2xl mr-2" />
        <span className="text-xl font-bold text-gray-900 dark:text-white">ProjectFlow</span>
      </div>

      <div className="px-4 pt-5 pb-2">
        {organizations.length > 0 ? (
          <Listbox value={activeOrg?.id || ''} onChange={handleOrgChange}>
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-100 dark:bg-gray-700 py-2 pl-3 pr-10 text-left text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <span className="block truncate">{activeOrg?.name || 'Select Org'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  {organizations.map((org) => (
                    <Listbox.Option
                      key={org.id}
                      className={({ active }) =>
                        clsx('relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 dark:text-gray-100', active && 'bg-indigo-600 text-white')
                      }
                      value={org.id}
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={clsx('block truncate', selected && 'font-semibold')}>{org.name}</span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        ) : (
          <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg">
            No Organizations
          </button>
        )}
      </div>

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
    </aside>
  )
}
