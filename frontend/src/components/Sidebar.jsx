import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  BarChart3, 
  LogOut, 
  X,
  CloudLightning
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onAddExpenseClick }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budgets', label: 'Monthly Budgets', icon: Wallet },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setIsOpen) setIsOpen(false);
  };

  const initial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <CloudLightning size={22} />
          </div>
          <div className="brand-text">
            <h2>CloudTrack</h2>
            <span>Expense Tracker</span>
          </div>
        </div>
        {setIsOpen && (
          <button 
            className="menu-toggle-btn" 
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-info">
            <div className="user-avatar">{initial}</div>
            <div className="user-meta">
              <div className="name">{user?.username || 'User'}</div>
              <div className="role">{user?.email || 'Logged in'}</div>
            </div>
          </div>
          <button 
            className="btn-icon-logout" 
            title="Log out" 
            onClick={logout}
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
