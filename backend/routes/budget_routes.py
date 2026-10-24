from datetime import datetime
from flask import Blueprint, request
from models import db, Budget, Expense, VALID_CATEGORIES, User
from utils import (
    success_response,
    error_response,
    token_required,
    validate_month_format,
)

budget_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")

@budget_bp.route("", methods=["GET"])
@token_required
def get_budgets(current_user: User):
    """
    Get all budgets for current user, optionally filtered by month (YYYY-MM).
    Computes real-time actual spending, remaining amount, percentage, and warning status.
    """
    current_month_default = datetime.now().strftime("%Y-%m")
    month = request.args.get("month", current_month_default).strip()

    if month and not validate_month_format(month):
        return error_response("Invalid month format. Expected YYYY-MM", 400)

    budgets = Budget.query.filter_by(user_id=current_user.id, month=month).all()

    # Calculate actual spending for this month
    monthly_expenses = Expense.query.filter(
        Expense.user_id == current_user.id,
        Expense.date.like(f"{month}%")
    ).all()

    total_spent = sum(e.amount for e in monthly_expenses)
    category_spent = {cat: 0.0 for cat in VALID_CATEGORIES}
    for e in monthly_expenses:
        if e.category in category_spent:
            category_spent[e.category] += e.amount

    # Map budgets and their progress
    budget_reports = []
    has_total_budget = False

    for b in budgets:
        if b.category == "Total":
            has_total_budget = True
            spent = total_spent
        else:
            spent = category_spent.get(b.category, 0.0)

        remaining = b.amount - spent
        percent_used = round((spent / b.amount * 100), 1) if b.amount > 0 else 0.0

        if percent_used >= 100:
            status = "exceeded"
            warning_msg = f"Alert: Budget exceeded by {current_user.currency} {abs(remaining):.2f}!"
        elif percent_used >= 80:
            status = "warning"
            warning_msg = f"Warning: {percent_used}% of budget consumed."
        else:
            status = "normal"
            warning_msg = "Within budget limits."

        budget_reports.append({
            "id": b.id,
            "category": b.category,
            "month": b.month,
            "budget_amount": round(b.amount, 2),
            "actual_spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "percentage_used": percent_used,
            "status": status,
            "warning_message": warning_msg
        })

    # Overall month summary
    warnings_list = [b["warning_message"] for b in budget_reports if b["status"] in ["warning", "exceeded"]]

    return success_response(
        data={
            "month": month,
            "budgets": budget_reports,
            "total_monthly_spent": round(total_spent, 2),
            "has_warnings": len(warnings_list) > 0,
            "warnings": warnings_list,
            "categories": ["Total"] + VALID_CATEGORIES
        },
        message="Budgets and progress loaded"
    )

@budget_bp.route("", methods=["POST"])
@token_required
def set_budget(current_user: User):
    """Create or update a budget for a category and month."""
    data = request.get_json() or {}
    category = data.get("category", "Total").strip()
    month = data.get("month", datetime.now().strftime("%Y-%m")).strip()
    amount = data.get("amount")

    valid_opts = ["Total"] + VALID_CATEGORIES
    if category not in valid_opts:
        return error_response(f"Category must be 'Total' or one of: {', '.join(VALID_CATEGORIES)}", 400)

    if not validate_month_format(month):
        return error_response("Month must be in YYYY-MM format", 400)

    try:
        amount_val = float(amount)
        if amount_val <= 0:
            return error_response("Budget amount must be a positive number", 400)
    except (ValueError, TypeError):
        return error_response("A valid numeric budget amount is required", 400)

    # Upsert: check if budget already exists for this month and category
    existing = Budget.query.filter_by(
        user_id=current_user.id,
        category=category,
        month=month
    ).first()

    if existing:
        existing.amount = round(amount_val, 2)
        budget_obj = existing
        action = "updated"
    else:
        budget_obj = Budget(
            user_id=current_user.id,
            category=category,
            month=month,
            amount=round(amount_val, 2)
        )
        db.session.add(budget_obj)
        action = "created"

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error saving budget: {str(e)}", 500)

    return success_response(
        data={"budget": budget_obj.to_dict()},
        message=f"Budget {action} successfully",
        status_code=200 if action == "updated" else 201
    )

@budget_bp.route("/<int:budget_id>", methods=["DELETE"])
@token_required
def delete_budget(current_user: User, budget_id: int):
    budget = Budget.query.filter_by(id=budget_id, user_id=current_user.id).first()
    if not budget:
        return error_response("Budget not found or unauthorized", 404)

    try:
        db.session.delete(budget)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return error_response("Failed to delete budget", 500)

    return success_response(message="Budget deleted successfully")
