import { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import Header from '@/components/shared/Header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LuCalendarDays } from 'react-icons/lu';
import { MdOutlineAssignmentTurnedIn } from 'react-icons/md';
import { FaBars } from 'react-icons/fa';
import { BiDockLeft, BiDockRight } from 'react-icons/bi';
import { MdLogout } from 'react-icons/md';
import { FaRegCircleUser } from 'react-icons/fa6';
import { signOut } from '@/lib/storage';

export default function ClientLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between bg-neutral-900 text-white p-4">
        <button onClick={() => setSidebarOpen(true)}>
          <FaBars size={24} />
        </button>
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed z-50 inset-y-0 left-0 bg-neutral-900 text-white p-4
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:static md:translate-x-0 
          ${collapsed ? 'md:w-20' : 'w-64 md:w-64'} 
          flex flex-col justify-between
        `}
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="mt-2">
            <Header />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-neutral-700 rounded p-1 hidden md:block"
          >
            {collapsed ? <BiDockRight size={25} /> : <BiDockLeft size={25} />}
          </button>
        </div>
       
        <div className="flex flex-col h-full mt-4 ">
          {/* Navigation */}
          <nav className="space-y-2 flex-1 ">
            <SidebarLink
              href="/client/calendar"
              icon={<LuCalendarDays size={22} />}
              label="Calendar"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
            <SidebarLink
              href="/client/request"
              icon={<MdOutlineAssignmentTurnedIn size={22} />}
              label="Request"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
          </nav>

          {/* User Menu at Bottom */}
          <div className="mt-6 border-t pt-4">
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

function SidebarLink({
  href,
  icon,
  label,
  collapsed,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className="flex items-center gap-2 hover:bg-neutral-700 rounded px-2 py-2"
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

