import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ExpenseModal from './components/ExpenseModal';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import BudgetsPage from './pages/BudgetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';

function MainApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Expense Modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💳</div>
          <p>Initializing Cloud-Based Expense Tracker...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-container">
      {/* Responsive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onAddExpenseClick={handleOpenAddExpense}
      />

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        <Navbar
          activeTab={activeTab}
          onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)}
          onAddExpenseClick={handleOpenAddExpense}
        />

        {/* Dynamic Pages */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            key={refreshTrigger}
            onNavigate={setActiveTab}
            onAddExpense={handleOpenAddExpense}
            onEditExpense={handleOpenEditExpense}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage
            onAddExpense={handleOpenAddExpense}
            onEditExpense={handleOpenEditExpense}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsPage key={refreshTrigger} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage key={refreshTrigger} />
        )}
      </div>

      {/* Global Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={handleExpenseSuccess}
        expenseToEdit={expenseToEdit}
        currency={user?.currency || 'USD'}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
