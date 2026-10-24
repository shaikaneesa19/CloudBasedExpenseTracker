import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  PieChart as PieIcon, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import SummaryCard from '../components/SummaryCard';
import BudgetAlertBanner from '../components/BudgetAlertBanner';
import CategoryChart from '../components/Charts/CategoryChart';
import MonthlyTrendChart from '../components/Charts/MonthlyTrendChart';
import ExpenseTable from '../components/ExpenseTable';

export default function DashboardPage({ onNavigate, onAddExpense, onEditExpense }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [dismissAlert, setDismissAlert] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.analytics.getDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.expenses.delete(id);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>⏳</div>
          <p>Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="auth-error" style={{ marginBottom: '20px' }}>
          {error}
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  const { currency, summary, category_data, monthly_trend, recent_transactions, budget_warning } = data || {};

  return (
    <div className="page-container">
      {/* Budget Warning Banner */}
      {!dismissAlert && budget_warning && (
        <BudgetAlertBanner 
          warning={budget_warning} 
          onDismiss={() => setDismissAlert(true)} 
        />
      )}

      {/* Summary Metrics Grid */}
      <div className="summary-grid">
        <SummaryCard
          title="This Month's Spending"
          value={`${currency} ${summary?.total_current_month?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
          meta={`Avg ${currency} ${summary?.avg_daily_this_month?.toFixed(2) || '0.00'} / day`}
          icon={Calendar}
          iconBg="rgba(14, 165, 233, 0.15)"
          iconColor="#38bdf8"
        />

        <SummaryCard
          title="Monthly Budget Status"
          value={
            summary?.monthly_budget > 0 
              ? `${summary.budget_used_percent}%` 
              : 'Not Set'
          }
          meta={
            summary?.monthly_budget > 0 
              ? `${currency} ${summary.remaining_budget?.toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining` 
              : 'Set a budget to track limits'
          }
          icon={TrendingUp}
          iconBg={
            summary?.budget_used_percent > 100 
              ? 'rgba(239, 68, 68, 0.15)' 
              : summary?.budget_used_percent >= 80 
              ? 'rgba(245, 158, 11, 0.15)' 
              : 'rgba(16, 185, 129, 0.15)'
          }
          iconColor={
            summary?.budget_used_percent > 100 
              ? '#f87171' 
              : summary?.budget_used_percent >= 80 
              ? '#fbbf24' 
              : '#34d399'
          }
        />

        <SummaryCard
          title="Top Category"
          value={summary?.top_category || 'None'}
          meta={
            summary?.top_category_amount > 0 
              ? `${currency} ${summary.top_category_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} this month` 
              : 'No expenses yet'
          }
          icon={PieIcon}
          iconBg="rgba(249, 115, 22, 0.15)"
          iconColor="#fb923c"
        />

        <SummaryCard
          title="All-Time Expenses"
          value={`${currency} ${summary?.total_all_time?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
          meta={`${summary?.total_transactions || 0} total transactions recorded`}
          icon={DollarSign}
          iconBg="rgba(99, 102, 241, 0.15)"
          iconColor="#818cf8"
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <TrendingUp size={18} color="var(--primary)" />
              <span>Monthly Spending Trend (Last 6 Months)</span>
            </h3>
          </div>
          <div className="chart-body">
            <MonthlyTrendChart data={monthly_trend} currency={currency} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <PieIcon size={18} color="var(--secondary)" />
              <span>Spending by Category (This Month)</span>
            </h3>
          </div>
          <div className="chart-body">
            <CategoryChart data={category_data} currency={currency} />
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="section-card">
        <div className="section-header">
          <h3>Recent Transactions</h3>
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('expenses')}
          >
            <span>View All Expenses</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <ExpenseTable
          expenses={recent_transactions}
          onEdit={onEditExpense}
          onDelete={handleDeleteExpense}
          currency={currency}
        />
      </div>
    </div>
  );
}
