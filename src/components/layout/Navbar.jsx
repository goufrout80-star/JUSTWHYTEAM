import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useInbox } from '../../hooks/useInbox';
import Avatar from '../ui/Avatar';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const { workspace } = useWorkspace();
  const { unreadCount } = useInbox(profile?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function close(e) { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-work', label: 'My Work', icon: ListChecks },
    { to: '/inbox', label: 'Inbox', icon: Bell, badge: unreadCount },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 h-12 flex items-center justify-between px-4 lg:px-6"
      style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-default)' }}>
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-[14px] font-medium hidden sm:block" style={{ color: 'var(--text-accent)' }}>
            {workspace.name || 'Just Why Team'}
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {navItems.map(item => (
            <Link key={item.to} to={item.to}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors relative"
              style={{
                color: isActive(item.to) ? 'var(--text-accent)' : 'var(--text-secondary)',
                background: isActive(item.to) ? 'rgba(0,224,192,0.06)' : 'transparent',
              }}>
              <item.icon size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-1 text-[10px] font-medium px-1.5 py-0 rounded-full badge-pop"
                  style={{ background: 'var(--gradient-glow)', color: '#0A1A19' }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          {profile && <Avatar username={profile.username} size="sm" />}
          <span className="text-[13px] font-medium hidden sm:block">{profile?.username}</span>
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg py-1 z-50"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <button onClick={() => { navigate('/settings'); setShowDropdown(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-accent)'; e.currentTarget.style.background = 'rgba(0,224,192,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
              <Settings size={14} strokeWidth={1.5} /> Settings
            </button>
            <div style={{ borderTop: '1px solid var(--border-default)', margin: '4px 0' }} />
            <button onClick={() => { signOut(); setShowDropdown(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors"
              style={{ color: 'var(--status-overdue)' }}>
              <LogOut size={14} strokeWidth={1.5} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
