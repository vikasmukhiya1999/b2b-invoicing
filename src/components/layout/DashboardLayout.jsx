import { useState, useMemo } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon as XIcon
} from '@heroicons/react/24/outline';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation links based on user role with memoization
  const navigation = useMemo(() => {
    return user?.role === 'seller'
      ? [
          { name: 'Dashboard', icon: HomeIcon, href: '/seller/dashboard', current: location.pathname === '/seller/dashboard' },
          { name: 'Invoices', icon: DocumentTextIcon, href: '/seller/invoices', current: location.pathname === '/seller/invoices' },
          { name: 'Create Invoice', icon: DocumentTextIcon, href: '/seller/invoices/create', current: location.pathname === '/seller/invoices/create' },
          { name: 'Profile', icon: UserIcon, href: '/profile', current: location.pathname === '/profile' }
        ]
      : [
          { name: 'Dashboard', icon: HomeIcon, href: '/buyer/dashboard', current: location.pathname === '/buyer/dashboard' },
          { name: 'Invoices', icon: DocumentTextIcon, href: '/buyer/invoices', current: location.pathname === '/buyer/invoices' },
          { name: 'Profile', icon: UserIcon, href: '/profile', current: location.pathname === '/profile' }
        ];
  }, [user?.role, location.pathname]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-50 transition-opacity duration-300 ease-in-out ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile menu */}
      <div 
        className={`fixed inset-0 z-50 md:hidden ${
          sidebarOpen ? '' : 'pointer-events-none'
        }`} 
        role="dialog" 
        aria-modal="true"
      >
        <div
          className={`fixed inset-y-0 left-0 flex w-full max-w-xs flex-1 flex-col bg-white transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile sidebar header */}
          <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200">
            <div className="font-semibold text-xl">Invoice App</div>
            <button
              type="button"
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Mobile navigation */}
          <div className="flex-1 overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 space-y-2 px-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 flex-shrink-0 transition-colors duration-200 ${
                      item.current
                        ? 'text-blue-700'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile profile section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full">
              <div className="flex items-center">
                <div>
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.name || 'User'}
                  </p>
                  <button 
                    onClick={() => {
                      setSidebarOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    <LogoutIcon className="mr-1 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <div className="font-semibold text-xl">Invoice App</div>
            </div>
            <nav className="mt-5 flex-1 space-y-2 px-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                      item.current
                        ? 'text-blue-700'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop profile section */}
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div>
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.name || 'User'}
                  </p>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    <LogoutIcon className="mr-1 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile top nav */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 bg-white shadow md:hidden">
          <button
            type="button"
            className="px-4 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 justify-center px-4">
            <div className="flex items-center">
              <div className="font-semibold text-lg">Invoice App</div>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="min-h-screen bg-gray-100">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;