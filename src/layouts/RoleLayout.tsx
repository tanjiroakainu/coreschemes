import { useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LuCalendarDays } from 'react-icons/lu';
import { FaBars } from 'react-icons/fa';
import { BiDockLeft, BiDockRight } from 'react-icons/bi';
import { MdLogout, MdOutlineAssignmentTurnedIn, MdMonitor, MdFactCheck, MdClose } from 'react-icons/md';
import { FaRegCircleUser } from 'react-icons/fa6';
import { MdDashboard } from 'react-icons/md';
import { signOut } from '@/lib/storage';

interface RoleLayoutProps {
  rolePath: string;
  roleName: string;
}

export default function RoleLayout({ rolePath, roleName: _roleName }: RoleLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between bg-neutral-900 text-white p-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-neutral-800 rounded"
        >
          <FaBars size={20} />
        </button>
        <h1 className="text-lg font-semibold">THE GOLD PANICLES</h1>
        <div className="w-8" />
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:static
          inset-y-0 left-0
          z-50
          w-64 ${collapsed ? 'md:w-16' : 'md:w-64'}
          bg-neutral-900 text-white
          transition-all duration-300 ease-in-out
          flex flex-col
        `}
      >
        <div className="p-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            {!collapsed && (
              <h1 className="text-lg font-semibold text-amber-500">
                THE GOLD PANICLES
              </h1>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-neutral-800 rounded hidden md:block"
          >
            {collapsed ? <BiDockRight size={20} /> : <BiDockLeft size={20} />}
          </button>
        </div>

        <div className="flex flex-col h-full mt-4">
          {/* Navigation */}
          <nav className="space-y-2 flex-1 px-2">
            <Link
              to={`/${rolePath}/dashboard`}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive('dashboard') && !isActive('assignment') && !isActive('calendar')
                  ? 'bg-neutral-700 text-amber-500'
                  : 'hover:bg-neutral-800 text-white'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <MdDashboard size={22} />
              {!collapsed && <span>Dashboard</span>}
            </Link>
            <Link
              to={`/${rolePath}/calendar`}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive('calendar')
                  ? 'bg-neutral-700 text-amber-500'
                  : 'hover:bg-neutral-800 text-white'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <LuCalendarDays size={22} />
              {!collapsed && <span>Calendar</span>}
            </Link>
            {(rolePath === 'scribe' || rolePath === 'creative' || rolePath === 'managerial' || rolePath === 'regular-staff') && (
              <>
                <Link
                  to={`/${rolePath}/assignment`}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                    isActive('assignment') && !isActive('assignment-notification')
                      ? 'bg-neutral-700 text-amber-500'
                      : 'hover:bg-neutral-800 text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <MdOutlineAssignmentTurnedIn size={22} />
                  {!collapsed && <span>Assignment</span>}
                </Link>
                <Link
                  to={`/${rolePath}/assignment-notification`}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                    isActive('assignment-notification')
                      ? 'bg-neutral-700 text-amber-500'
                      : 'hover:bg-neutral-800 text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <MdOutlineAssignmentTurnedIn size={22} />
                  {!collapsed && <span>Notifications</span>}
                </Link>
                {(rolePath === 'scribe' || rolePath === 'creative' || rolePath === 'managerial') && (
                  <>
                    <Link
                      to={`/${rolePath}/completed`}
                      className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                        isActive('completed')
                          ? 'bg-neutral-700 text-amber-500'
                          : 'hover:bg-neutral-800 text-white'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <MdFactCheck size={22} />
                      {!collapsed && <span>Completed</span>}
                    </Link>
                    <Link
                      to={`/${rolePath}/rejected`}
                      className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                        isActive('rejected')
                          ? 'bg-neutral-700 text-amber-500'
                          : 'hover:bg-neutral-800 text-white'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <MdClose size={22} />
                      {!collapsed && <span>Rejected</span>}
                    </Link>
                  </>
                )}
              </>
            )}
            {rolePath === 'regular-staff' && (
              <>
                <Link
                  to={`/${rolePath}/rejected`}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                    isActive('rejected')
                      ? 'bg-neutral-700 text-amber-500'
                      : 'hover:bg-neutral-800 text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <MdClose size={22} />
                  {!collapsed && <span>Rejected</span>}
                </Link>
                <Link
                  to={`/${rolePath}/coverage`}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                    isActive('coverage')
                      ? 'bg-neutral-700 text-amber-500'
                      : 'hover:bg-neutral-800 text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <MdMonitor size={22} />
                  {!collapsed && <span>Coverage</span>}
                </Link>
              </>
            )}
          </nav>

          {/* User Menu at Bottom */}
          <div className="mt-6 border-t pt-4 px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-neutral-700 rounded px-2 py-2 w-full text-left">
                  <FaRegCircleUser size={22} />
                  {!collapsed && <span>Account</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-neutral-800 text-white">
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    navigate('/');
                  }}
                  className="flex items-center gap-2"
                >
                  <MdLogout size={22} className="text-white" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 bg-neutral-100 p-4 sm:p-6 mt-4 md:mt-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'opacity-100' : 'opacity-100'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <Outlet />
      </main>
    </div>
  );
}

