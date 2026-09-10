import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, History, User, LogOut, Sun, Moon, FolderOpen, X, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Modal from '../ui/Modal';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const getInitials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const sidebarContent = (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-16 cursor-pointer' : 'w-64'}`}
      onClick={() => {
        if (collapsed) setCollapsed(false);
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in flex-1">
            <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">HiFileShare</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Secure File Sharing</p>
          </div>
        )}
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
          className="hidden lg:flex ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Close button (mobile only) */}
        <button
          onClick={onMobileClose}
          className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              isActive
                ? `nav-item-active ${collapsed ? 'justify-center' : ''}`
                : `nav-item ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`nav-item w-full ${collapsed ? 'justify-center' : ''}`}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 flex-shrink-0 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0 text-primary-500" />
          )}
          {!collapsed && (
            <span className="animate-fade-in">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={() => setLogoutModalOpen(true)}
          className={`nav-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 ${collapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 animate-fade-in">
            {user.pfpUrl ? (
              <img src={user.pfpUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/30" />
            ) : (
              <div className="avatar w-8 h-8 text-xs ring-2 ring-primary-500/30">
                {getInitials(user.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.username}</p>
            </div>
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center mt-1">
            {user.pfpUrl ? (
              <img src={user.pfpUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-500/30" />
            ) : (
              <div className="avatar w-8 h-8 text-xs ring-2 ring-primary-500/30">
                {getInitials(user.name)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">{sidebarContent}</div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Are you sure?"
      >
        <div className="flex flex-col gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to logout? Once logged out, you will need to enter your credentials to login again.
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
