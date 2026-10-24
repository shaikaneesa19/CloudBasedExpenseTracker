import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '../services/api';

const BUDGET_CATEGORIES = ['Total', 'Food', 'Travel', 'Education', 'Shopping', 'Bills', 'Others'];

export default function BudgetModal({ isOpen, onClose, onSuccess, initialMonth, initialCategory, initialAmount, currency = 'USD' }) {
  const currentMonthDefault = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(initialMonth || currentMonthDefault);
  const [category, setCategory] = useState(initialCategory || 'Total');
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMonth(initialMonth || currentMonthDefault);
      setCategory(initialCategory || 'Total');
      setAmount(initialAmount ? String(initialAmount) : '');
      setError('');
    }
  }, [isOpen, initialMonth, initialCategory, initialAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!month) {
      setError('Please select a target budget month.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.budgets.set({
        category,
        month,
        amount: parsedAmount
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to set budget. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Set Monthly Budget</h3>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label>Budget Target</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {BUDGET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Total' ? 'Overall Monthly Total' : `${cat} Category`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Month (YYYY-MM)</label>
              <input
                type="month"
                className="form-input"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Budget Limit ({currency})</label>
              <input
                type="number"
                step="1"
                min="1"
                className="form-input"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <Check size={16} />
              <span>{isSubmitting ? 'Saving...' : 'Set Budget'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
