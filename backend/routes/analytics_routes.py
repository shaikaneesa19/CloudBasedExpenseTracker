from datetime import datetime, timedelta
from flask import Blueprint, request
from sqlalchemy import func
from models import db, Expense, Budget, VALID_CATEGORIES, User
from utils import success_response, error_response, token_required

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/dashboard", methods=["GET"])
@token_required
def get_dashboard_data(current_user: User):
    """
    Returns aggregated metrics for the dashboard:
    1. Summary cards (Total All-time, Current Month Total, Month Budget, Avg Daily Spend, Top Category)
    2. Category Breakdown (for Doughnut/Pie chart)
    3. Monthly Trends (last 6 months for Line/Bar chart)
    4. Recent transactions (last 6 items)
    5. Active budget warnings
    """
    now = datetime.now()
    current_month = now.strftime("%Y-%m")

    # 1. All expenses for user
    all_expenses = Expense.query.filter_by(user_id=current_user.id).all()
    total_all_time = sum(e.amount for e in all_expenses)
    total_transactions_count = len(all_expenses)

    # 2. Current Month expenses
    current_month_expenses = [e for e in all_expenses if e.date.startswith(current_month)]
    total_current_month = sum(e.amount for e in current_month_expenses)

    # Calculate days in month so far for average daily spend
    day_of_month = max(1, now.day)
    avg_daily_this_month = total_current_month / day_of_month

    # 3. Category Breakdown for current month or all-time (we provide both)
    month_category_map = {cat: 0.0 for cat in VALID_CATEGORIES}
    for e in current_month_expenses:
        if e.category in month_category_map:
            month_category_map[e.category] += e.amount

    all_time_category_map = {cat: 0.0 for cat in VALID_CATEGORIES}
    for e in all_expenses:
        if e.category in all_time_category_map:
            all_time_category_map[e.category] += e.amount

    # Find top category this month
    top_category = "None"
    top_category_amount = 0.0
    for cat, amt in month_category_map.items():
        if amt > top_category_amount:
            top_category = cat
            top_category_amount = amt

    # 4. Monthly Trend: Last 6 calendar months
    months_list = []
    # Generate last 6 months in chronological order
    for i in range(5, -1, -1):
        # approximate month offset
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        m_str = f"{year:04d}-{month:02d}"
        months_list.append(m_str)

    monthly_trend = []
    for m in months_list:
        m_expenses = [e for e in all_expenses if e.date.startswith(m)]
        m_sum = sum(e.amount for e in m_expenses)
        dt = datetime.strptime(m, "%Y-%m")
        label = dt.strftime("%b %Y")
        monthly_trend.append({
            "month": m,
            "label": label,
            "total": round(m_sum, 2)
        })

    # 5. Budget Status for current month
    total_budget_row = Budget.query.filter_by(
        user_id=current_user.id,
        category="Total",
        month=current_month
    ).first()

    monthly_budget = total_budget_row.amount if total_budget_row else 0.0
    budget_used_percent = round((total_current_month / monthly_budget * 100), 1) if monthly_budget > 0 else 0.0
    remaining_budget = monthly_budget - total_current_month if monthly_budget > 0 else 0.0

    budget_warning = None
    if monthly_budget > 0:
        if total_current_month > monthly_budget:
            budget_warning = {
                "type": "danger",
                "message": f"Alert! You exceeded your monthly budget by {current_user.currency} {(total_current_month - monthly_budget):.2f}"
            }
        elif budget_used_percent >= 80:
            budget_warning = {
                "type": "warning",
                "message": f"Caution: You have used {budget_used_percent}% of your monthly budget."
            }

    # 6. Recent transactions (latest 6)
    recent_transactions = Expense.query.filter_by(user_id=current_user.id)\
        .order_by(Expense.date.desc(), Expense.id.desc())\
        .limit(6).all()

    return success_response(
        data={
            "currency": current_user.currency,
            "current_month": current_month,
            "summary": {
                "total_all_time": round(total_all_time, 2),
                "total_current_month": round(total_current_month, 2),
                "monthly_budget": round(monthly_budget, 2),
                "remaining_budget": round(remaining_budget, 2),
                "budget_used_percent": budget_used_percent,
                "avg_daily_this_month": round(avg_daily_this_month, 2),
                "top_category": top_category,
                "top_category_amount": round(top_category_amount, 2),
                "total_transactions": total_transactions_count
            },
            "category_data": {
                "labels": list(month_category_map.keys()),
                "current_month_values": [round(val, 2) for val in month_category_map.values()],
                "all_time_values": [round(val, 2) for val in all_time_category_map.values()]
            },
            "monthly_trend": monthly_trend,
            "recent_transactions": [t.to_dict() for t in recent_transactions],
            "budget_warning": budget_warning
        },
        message="Dashboard analytics generated"
    )
