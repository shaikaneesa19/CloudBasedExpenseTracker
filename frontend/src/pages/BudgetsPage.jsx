import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Calendar 
} from 'lucide-react';
import { api } from '../services/api';
import BudgetModal from '../components/BudgetModal';
import { useAuth } from '../context/AuthContext';

export default function BudgetsPage() {
  const { user } = useAuth();
  const currentMonthDefault = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthDefault);
  const [budgetsData, setBudgetsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('Total');
  const [modalAmount, setModalAmount] = useState('');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.budgets.get(selectedMonth);
      if (res.data) {
        setBudgetsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const handleOpenSetBudget = (category = 'Total', amount = '') => {
    setModalCategory(category);
    setModalAmount(amount);
    setIsModalOpen(true);
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await api.budgets.delete(id);
      fetchBudgets();
    } catch (err) {
      alert(err.message || 'Failed to delete budget');
    }
  };

  const { budgets = [], total_monthly_spent = 0, warnings = [] } = budgetsData || {};
  const totalBudgetObj = budgets.find(b => b.category === 'Total');
  const categoryBudgets = budgets.filter(b => b.category !== 'Total');

  return (
    <div className="page-container">
      {/* Month Selection and Quick Actions */}
      <div className="section-card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <div>
            <h3>Monthly Budget Management</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Set spending thresholds to control expenditures and prevent overdrafts
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <input
                type="month"
                className="filter-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={() => handleOpenSetBudget('Total')}>
              <Plus size={16} />
              <span>Set Budget</span>
            </button>
          </div>
        </div>

        {/* Warnings list if any */}
        {warnings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {warnings.map((warn, idx) => (
              <div 
                key={idx} 
                className="alert-banner danger" 
                style={{ marginBottom: 0, padding: '10px 16px' }}
              >
                <div className="alert-content">
                  <AlertCircle size={18} />
                  <span>{warn}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Overall Monthly Budget Card */}
      <div className="section-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="brand-icon" style={{ width: '32px', height: '32px' }}>
                <Wallet size={18} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>Overall Monthly Budget</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Target month: <strong>{selectedMonth}</strong>
            </p>
          </div>

          {totalBudgetObj ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {user?.currency || 'USD'} {Number(totalBudgetObj.budget_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Spent: {user?.currency || 'USD'} {Number(totalBudgetObj.actual_spent).toLocaleString(undefined, { minimumFractionDigits: 2 })} ({totalBudgetObj.percentage_used}%)
              </div>
            </div>
          ) : (
            <button className="btn-secondary" onClick={() => handleOpenSetBudget('Total')}>
              + Set Total Budget
            </button>
          )}
        </div>

        {totalBudgetObj ? (
          <div style={{ marginTop: '16px' }}>
            <div className="progress-track" style={{ height: '12px' }}>
              <div 
                className={`progress-fill ${totalBudgetObj.status}`}
                style={{ width: `${Math.min(100, totalBudgetObj.percentage_used)}%` }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.86rem' }}>
              <span style={{ color: totalBudgetObj.status === 'exceeded' ? 'var(--danger)' : totalBudgetObj.status === 'warning' ? 'var(--warning)' : 'var(--success)' }}>
                {totalBudgetObj.warning_message}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                Remaining: <strong>{user?.currency || 'USD'} {Number(totalBudgetObj.remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            ℹ️ No overall budget limit is configured for this month. Set a budget to receive warning alerts when expenses exceed your goals.
          </div>
        )}
      </div>

      {/* Category Budgets Grid */}
      <div className="section-card">
        <div className="section-header">
          <h3>Category Budgets</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Track category-specific thresholds (e.g. Food, Shopping, Travel)
          </p>
        </div>

        {categoryBudgets.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No category budgets defined for {selectedMonth}.</p>
            <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>Click "Set Budget" to allocate budgets to specific categories.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {categoryBudgets.map((b) => (
              <div key={b.id} className="budget-card">
                <div className="budget-card-header">
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>
                    {b.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {user?.currency || 'USD'} {Number(b.budget_amount).toFixed(2)}
                    </span>
                    <button 
                      className="action-btn delete"
                      title="Delete budget"
                      onClick={() => handleDeleteBudget(b.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="progress-track">
                  <div 
                    className={`progress-fill ${b.status}`}
                    style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '6px' }}>
                  <span style={{ color: b.status === 'exceeded' ? 'var(--danger)' : b.status === 'warning' ? 'var(--warning)' : 'var(--text-muted)' }}>
                    Spent: {user?.currency || 'USD'} {Number(b.actual_spent).toFixed(2)} ({b.percentage_used}%)
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>
                    Left: {user?.currency || 'USD'} {Number(b.remaining).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBudgets}
        initialMonth={selectedMonth}
        initialCategory={modalCategory}
        initialAmount={modalAmount}
        currency={user?.currency || 'USD'}
      />
    </div>
  );
}
