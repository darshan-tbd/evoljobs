import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  GlobeAltIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <HomeIcon className="w-5 h-5" />,
      href: '/admin_dashboard',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
    },
    {
      text: 'Users',
      icon: <UsersIcon className="w-5 h-5" />,
      href: '/admin_dashboard/users',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
    },
    {
      text: 'Companies',
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      href: '/admin_dashboard/companies',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
    },
    {
      text: 'Jobs',
      icon: <BriefcaseIcon className="w-5 h-5" />,
      href: '/admin_dashboard/jobs',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
    },
    {
      text: 'Applications',
      icon: <DocumentTextIcon className="w-5 h-5" />,
      href: '/admin_dashboard/applications',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      hoverColor: 'hover:bg-red-100',
    },
    {
      text: 'Notifications',
      icon: <BellIcon className="w-5 h-5" />,
      href: '/admin_dashboard/notifications',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100',
    },
    {
      text: 'Analytics',
      icon: <ChartBarIcon className="w-5 h-5" />,
      href: '/admin_dashboard/analytics',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      hoverColor: 'hover:bg-teal-100',
    },
    {
      text: 'AI & ML',
      icon: <CpuChipIcon className="w-5 h-5" />,
      href: '/admin_dashboard/ai',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      hoverColor: 'hover:bg-pink-100',
    },
    {
      text: 'Search',
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      href: '/admin_dashboard/search',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      hoverColor: 'hover:bg-cyan-100',
    },
    {
      text: 'Scrapers',
      icon: <GlobeAltIcon className="w-5 h-5" />,
      href: '/admin_dashboard/scrapers',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      hoverColor: 'hover:bg-amber-100',
    },
    {
      text: 'Subscriptions',
      icon: <CreditCardIcon className="w-5 h-5" />,
      href: '/admin_dashboard/subscription-management',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:bg-emerald-100',
    },
    {
      text: 'Settings',
      icon: <Cog6ToothIcon className="w-5 h-5" />,
      href: '/admin_dashboard/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      hoverColor: 'hover:bg-gray-100',
    },

  ];

  const isActiveRoute = (href: string) => {
    return router.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:inset-0 flex flex-col flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-blue-100 text-xs">Management Console</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Navigation Menu - Takes available space */}
          <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActiveRoute(item.href)
                    ? `${item.bgColor} ${item.color} shadow-sm border-l-4 border-current`
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={`mr-3 ${isActiveRoute(item.href) ? item.color : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                {item.text}
              </Link>
            ))}
          </nav>

          {/* User Info - Fixed at bottom, aligned with main content */}
          <div className="flex-shrink-0 px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <ShieldCheckIcon className="w-3 h-3 mr-1" />
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between h-16 px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Page title */}
            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg font-semibold text-gray-900 lg:hidden">Admin Panel</h2>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2.5 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="flex items-center mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <ShieldCheckIcon className="w-3 h-3 mr-1" />
                          Administrator
                        </span>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => router.push('/admin_dashboard/settings')}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Cog6ToothIcon className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 px-6 lg:px-8 pt-2 pb-6 lg:pt-4 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 