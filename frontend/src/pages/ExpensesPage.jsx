import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  Filter, 
  RefreshCw,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import ExpenseTable from '../components/ExpenseTable';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Food', 'Travel', 'Education', 'Shopping', 'Bills', 'Others'];

export default function ExpensesPage({ onAddExpense, onEditExpense, refreshTrigger }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [month, setMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      if (month) params.month = month;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.expenses.list(params);
      if (res.data) {
        setExpenses(res.data.expenses || []);
        setTotalAmount(res.data.total_amount || 0);
      }
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [category, month, startDate, endDate, refreshTrigger]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setMonth('');
    setStartDate('');
    setEndDate('');
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.expenses.delete(id);
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = {};
      if (category && category !== 'All') params.category = category;
      if (month) params.month = month;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const blob = await api.expenses.downloadCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Expense_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message || 'Error downloading CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Action Header & Summary */}
      <div className="section-card" style={{ marginBottom: '20px' }}>
        <div className="section-header">
          <div>
            <h3>Expense Records</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Showing {expenses.length} transaction{expenses.length === 1 ? '' : 's'} • Total: <strong style={{ color: '#fff' }}>{user?.currency || 'USD'} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn-secondary" 
              onClick={handleExportCsv} 
              disabled={isExporting || expenses.length === 0}
              title="Download CSV expense report"
            >
              <Download size={16} />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
            <button className="btn-primary" onClick={onAddExpense}>
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <form onSubmit={handleSearchSubmit} className="filter-bar">
          <div className="search-input-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by title or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <input
            type="month"
            className="filter-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            title="Filter by month"
          />

          <button type="submit" className="btn-secondary">
            <Filter size={15} />
            <span>Filter</span>
          </button>

          {(search || category !== 'All' || month || startDate || endDate) && (
            <button 
              type="button" 
              className="btn-danger-outline" 
              onClick={handleResetFilters}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Expenses Table */}
      <div className="section-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px auto' }} />
            <p>Loading expenses...</p>
          </div>
        ) : (
          <ExpenseTable
            expenses={expenses}
            onEdit={onEditExpense}
            onDelete={handleDeleteExpense}
            currency={user?.currency || 'USD'}
          />
        )}
      </div>
    </div>
  );
}
