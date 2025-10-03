import React, { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      show: hasPermission('view_dashboard'),
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: ChartBarIcon,
      show: hasPermission('read_leads'),
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: UserGroupIcon,
      show: hasPermission('read_clients'),
    },
    {
      name: 'Users',
      href: '/users',
      icon: UsersIcon,
      show: hasPermission('read_users'),
    },
    {
      name: 'Companies',
      href: '/companies',
      icon: BuildingOfficeIcon,
      show: isSuperAdmin(),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
      show: hasPermission('manage_settings'),
    },
  ].filter(item => item.show);

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-primary-600">
        <Link to="/dashboard" className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold text-lg">C</span>
            </div>
          </div>
          <div className="ml-3">
            <h2 className="text-white text-lg font-semibold">CRM System</h2>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 bg-white">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 p-4 bg-gray-50 border-t border-gray-200">
        <Link
          to="/profile"
          className="group block w-full"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.displayName}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;













