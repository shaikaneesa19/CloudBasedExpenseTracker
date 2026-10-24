import React from 'react';
import { Edit2, Trash2, Tag } from 'lucide-react';

const CATEGORY_CLASS_MAP = {
  Food: 'badge-food',
  Travel: 'badge-travel',
  Education: 'badge-education',
  Shopping: 'badge-shopping',
  Bills: 'badge-bills',
  Others: 'badge-others'
};

export default function ExpenseTable({ expenses, onEdit, onDelete, currency = 'USD' }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
        <Tag size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
        <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>No expense records found.</p>
        <p style={{ fontSize: '0.85rem' }}>Click "Add Expense" to record your first transaction.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Title / Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Notes</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => {
            const badgeClass = CATEGORY_CLASS_MAP[expense.category] || 'badge-others';
            return (
              <tr key={expense.id}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                  {expense.date}
                </td>
                <td className="expense-title-cell">
                  {expense.title}
                </td>
                <td>
                  <span className={`category-badge ${badgeClass}`}>
                    {expense.category}
                  </span>
                </td>
                <td className="amount-text">
                  {currency} {Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="expense-notes-cell">
                  {expense.notes || '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="action-btn"
                      title="Edit expense"
                      onClick={() => onEdit(expense)}
                      aria-label="Edit expense"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn delete"
                      title="Delete expense"
                      onClick={() => onDelete(expense.id)}
                      aria-label="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
