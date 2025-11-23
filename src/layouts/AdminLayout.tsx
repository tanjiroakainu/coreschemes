import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import Header from '@/components/shared/Header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MdOutlineDashboard,
  MdOutlineAssignmentTurnedIn,
  MdFactCheck,
} from 'react-icons/md';
import { LuCalendarDays } from 'react-icons/lu';
import { FaUsers, FaBars } from 'react-icons/fa';
import { BiDockLeft, BiDockRight } from 'react-icons/bi';
import { MdLogout } from 'react-icons/md';
import { IoSettingsOutline } from 'react-icons/io5';
import { signOut, getCurrentUser } from '@/lib/storage';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
    };
    
    loadUser();
    
    // Refresh user data when localStorage changes (e.g., profile update)
    const handleStorageChange = () => {
      loadUser();
    };
    
    // Refresh user data when window gets focus
    const handleFocus = () => {
      loadUser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    // Also listen for custom events
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
              href="/admin/dashboard"
              icon={<MdOutlineDashboard size={22} />}
              label="Dashboard"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
            <SidebarLink
              href="/admin/calendar"
              icon={<LuCalendarDays size={22} />}
              label="Calendar"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
            <SidebarLink
              href="/admin/client-availability"
              icon={<LuCalendarDays size={22} />}
              label="Client Availability"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
            <SidebarLink
              href="/admin/assignment"
              icon={<MdOutlineAssignmentTurnedIn size={22} />}
              label="Assignment"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
            <SidebarLink
              href="/admin/completed"
              icon={<MdFactCheck size={22} />}
              label="Completed"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
            <SidebarLink
              href="/admin/requests"
              icon={<MdOutlineAssignmentTurnedIn size={22} />}
              label="Requests"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
            <SidebarLink
              href="/admin/staffer"
              icon={<FaUsers size={22} />}
              label="Staffers"
              collapsed={collapsed}
              onClick={() => setSidebarOpen(false)}
            />
          </nav>

          {/* User Menu at Bottom */}
          <div className="mt-6 border-t pt-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-neutral-700 rounded px-2 py-2 w-full text-left">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name || 'Admin'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium">
                      {getInitials(currentUser?.name)}
                    </div>
                  )}
                  {!collapsed && <span>{currentUser?.name || 'Account'}</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-neutral-800 text-white">
                <DropdownMenuItem
                  onClick={() => navigate('/admin/settings')}
                  className="flex items-center gap-2"
                >
                  <IoSettingsOutline size={22} className="text-white" />{' '}
                  Settings
                </DropdownMenuItem>

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

