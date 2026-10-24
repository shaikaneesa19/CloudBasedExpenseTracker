import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

export default function BudgetAlertBanner({ warning, onDismiss }) {
  if (!warning) return null;

  const isDanger = warning.type === 'danger' || warning.status === 'exceeded';
  const Icon = isDanger ? AlertCircle : AlertTriangle;

  return (
    <div className={`alert-banner ${isDanger ? 'danger' : 'warning'}`}>
      <div className="alert-content">
        <Icon size={20} />
        <span>{warning.message}</span>
      </div>
      {onDismiss && (
        <button className="alert-close" onClick={onDismiss} aria-label="Dismiss alert">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
