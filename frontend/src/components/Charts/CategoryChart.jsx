import React, { useEffect, useRef } from 'react';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const CATEGORY_COLORS = {
  Food: '#f97316',
  Travel: '#3b82f6',
  Education: '#8b5cf6',
  Shopping: '#ec4899',
  Bills: '#14b8a6',
  Others: '#eab308'
};

export default function CategoryChart({ data, currency = 'USD' }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = data?.labels || ['Food', 'Travel', 'Education', 'Shopping', 'Bills', 'Others'];
    const values = data?.current_month_values || [0, 0, 0, 0, 0, 0];
    const total = values.reduce((sum, v) => sum + v, 0);

    const backgroundColors = labels.map(cat => CATEGORY_COLORS[cat] || '#64748b');

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: total > 0 ? values : [1],
          backgroundColor: total > 0 ? backgroundColors : ['#334155'],
          borderColor: '#111827',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#94a3b8',
              font: {
                family: "'Inter', sans-serif",
                size: 12
              },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function (context) {
                if (total === 0) return 'No expenses this month';
                const val = context.raw || 0;
                const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data, currency]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
