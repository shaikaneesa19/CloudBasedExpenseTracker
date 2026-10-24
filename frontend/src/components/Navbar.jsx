import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, onToggleMenu, onAddExpenseClick }) {
  const { user } = useAuth();

  const tabTitles = {
    dashboard: { title: 'Financial Dashboard', subtitle: 'Overview of spending, budgets, and trends' },
    expenses: { title: 'Expense Records', subtitle: 'Manage, search, and export your transactions' },
    budgets: { title: 'Budget Management', subtitle: 'Set monthly targets and monitor spending thresholds' },
    analytics: { title: 'Analytics & Insights', subtitle: 'Category breakdowns and visual financial metrics' },
  };

  const current = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button 
          className="menu-toggle-btn" 
          onClick={onToggleMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="page-title-badge">
          <h1>{current.title}</h1>
          <p>{current.subtitle}</p>
        </div>
      </div>

      <div className="navbar-actions">
        <div className="currency-tag">
          Currency: {user?.currency || 'USD'}
        </div>
        <button className="btn-primary" onClick={onAddExpenseClick}>
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>
    </header>
  );
}
