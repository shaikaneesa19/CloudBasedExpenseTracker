import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Download, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import CategoryChart from '../components/Charts/CategoryChart';
import MonthlyTrendChart from '../components/Charts/MonthlyTrendChart';
import { useAuth } from '../context/AuthContext';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.analytics.getDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await api.expenses.downloadCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Full_Expense_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message || 'Failed to download report');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading financial analytics...</p>
      </div>
    );
  }

  const { currency = 'USD', summary, category_data, monthly_trend } = data || {};
  const labels = category_data?.labels || [];
  const monthValues = category_data?.current_month_values || [];
  const allTimeValues = category_data?.all_time_values || [];
  const totalMonth = monthValues.reduce((a, b) => a + b, 0);

  return (
    <div className="page-container">
      {/* Analytics Header */}
      <div className="section-card" style={{ marginBottom: '24px' }}>
        <div className="section-header">
          <div>
            <h3>Analytics & Financial Reports</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Deep dive into your expense distribution, spending trends, and export records
            </p>
          </div>

          <button 
            className="btn-primary" 
            onClick={handleExportCsv}
            disabled={isExporting}
          >
            <Download size={16} />
            <span>{isExporting ? 'Exporting...' : 'Download Full CSV Report'}</span>
          </button>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <TrendingUp size={18} color="var(--primary)" />
              <span>Multi-Month Spending History</span>
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
              <span>Category Allocation Breakdown</span>
            </h3>
          </div>
          <div className="chart-body">
            <CategoryChart data={category_data} currency={currency} />
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="section-card">
        <div className="section-header">
          <h3>Category Distribution Details</h3>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>This Month ({currency})</th>
                <th>Share of Month (%)</th>
                <th>All-Time Total ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((cat, idx) => {
                const mVal = monthValues[idx] || 0;
                const aVal = allTimeValues[idx] || 0;
                const share = totalMonth > 0 ? ((mVal / totalMonth) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={cat}>
                    <td style={{ fontWeight: 600 }}>{cat}</td>
                    <td className="amount-text">{currency} {mVal.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-track" style={{ width: '80px', height: '6px', margin: 0 }}>
                          <div 
                            className="progress-fill normal" 
                            style={{ width: `${share}%` }} 
                          />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{share}%</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{currency} {aVal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
