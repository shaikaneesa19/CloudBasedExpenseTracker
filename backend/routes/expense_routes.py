import io
import csv
from datetime import datetime
from flask import Blueprint, request, Response
from models import db, Expense, VALID_CATEGORIES, User
from utils import (
    success_response,
    error_response,
    token_required,
    validate_date_format,
)

expense_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

@expense_bp.route("", methods=["GET"])
@token_required
def get_expenses(current_user: User):
    """
    List user expenses with optional filters:
    - category: string
    - start_date: YYYY-MM-DD
    - end_date: YYYY-MM-DD
    - month: YYYY-MM
    - search: text query matching title or notes
    - limit: int (optional)
    """
    category = request.args.get("category", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    month = request.args.get("month", "").strip()
    search = request.args.get("search", "").strip()
    limit = request.args.get("limit", type=int)

    query = Expense.query.filter_by(user_id=current_user.id)

    if category and category != "All":
        query = query.filter(Expense.category == category)

    if month:
        # e.g. "2025-05" -> matches dates starting with "2025-05"
        query = query.filter(Expense.date.like(f"{month}%"))

    if start_date:
        query = query.filter(Expense.date >= start_date)

    if end_date:
        query = query.filter(Expense.date <= end_date)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Expense.title.ilike(search_filter)) | (Expense.notes.ilike(search_filter))
        )

    # Order newest first
    query = query.order_by(Expense.date.desc(), Expense.id.desc())

    if limit and limit > 0:
        expenses = query.limit(limit).all()
    else:
        expenses = query.all()

    total_amount = sum(e.amount for e in expenses)

    return success_response(
        data={
            "expenses": [e.to_dict() for e in expenses],
            "count": len(expenses),
            "total_amount": round(total_amount, 2),
            "categories": VALID_CATEGORIES
        },
        message="Expenses retrieved successfully"
    )

@expense_bp.route("/<int:expense_id>", methods=["GET"])
@token_required
def get_single_expense(current_user: User, expense_id: int):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return error_response("Expense not found or access denied", 404)
    return success_response(data={"expense": expense.to_dict()})

@expense_bp.route("", methods=["POST"])
@token_required
def create_expense(current_user: User):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    amount = data.get("amount")
    category = data.get("category", "").strip()
    date_str = data.get("date", "").strip()
    notes = data.get("notes", "").strip()

    errors = {}
    if not title:
        errors["title"] = "Title is required."
    
    try:
        amount_val = float(amount)
        if amount_val <= 0:
            errors["amount"] = "Amount must be greater than zero."
    except (ValueError, TypeError):
        errors["amount"] = "A valid positive number is required for amount."

    if not category or category not in VALID_CATEGORIES:
        errors["category"] = f"Category must be one of: {', '.join(VALID_CATEGORIES)}"

    if not date_str or not validate_date_format(date_str):
        errors["date"] = "Valid date in YYYY-MM-DD format is required."

    if errors:
        return error_response("Validation failed", 400, errors=errors)

    new_expense = Expense(
        user_id=current_user.id,
        title=title,
        amount=round(float(amount), 2),
        category=category,
        date=date_str,
        notes=notes
    )

    try:
        db.session.add(new_expense)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Database error saving expense: {str(e)}", 500)

    return success_response(
        data={"expense": new_expense.to_dict()},
        message="Expense added successfully",
        status_code=201
    )

@expense_bp.route("/<int:expense_id>", methods=["PUT"])
@token_required
def update_expense(current_user: User, expense_id: int):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return error_response("Expense not found or unauthorized", 404)

    data = request.get_json() or {}
    title = data.get("title", expense.title).strip()
    amount = data.get("amount", expense.amount)
    category = data.get("category", expense.category).strip()
    date_str = data.get("date", expense.date).strip()
    notes = data.get("notes", expense.notes)

    errors = {}
    if not title:
        errors["title"] = "Title cannot be empty."

    try:
        amount_val = float(amount)
        if amount_val <= 0:
            errors["amount"] = "Amount must be greater than zero."
    except (ValueError, TypeError):
        errors["amount"] = "Valid numeric amount is required."

    if category and category not in VALID_CATEGORIES:
        errors["category"] = f"Category must be one of: {', '.join(VALID_CATEGORIES)}"

    if date_str and not validate_date_format(date_str):
        errors["date"] = "Valid date in YYYY-MM-DD format is required."

    if errors:
        return error_response("Validation failed", 400, errors=errors)

    expense.title = title
    expense.amount = round(float(amount), 2)
    expense.category = category
    expense.date = date_str
    expense.notes = notes

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(f"Failed to update expense: {str(e)}", 500)

    return success_response(
        data={"expense": expense.to_dict()},
        message="Expense updated successfully"
    )

@expense_bp.route("/<int:expense_id>", methods=["DELETE"])
@token_required
def delete_expense(current_user: User, expense_id: int):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return error_response("Expense not found or unauthorized", 404)

    try:
        db.session.delete(expense)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response("Failed to delete expense", 500)

    return success_response(message="Expense deleted successfully")

@expense_bp.route("/export/csv", methods=["GET"])
@token_required
def export_csv(current_user: User):
    """Download user's filtered or all expenses as a CSV file."""
    category = request.args.get("category", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    month = request.args.get("month", "").strip()

    query = Expense.query.filter_by(user_id=current_user.id)
    if category and category != "All":
        query = query.filter(Expense.category == category)
    if month:
        query = query.filter(Expense.date.like(f"{month}%"))
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()

    # Generate CSV stream
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Expense ID", "Date", "Title", "Category", f"Amount ({current_user.currency})", "Notes"])

    for exp in expenses:
        writer.writerow([
            exp.id,
            exp.date,
            exp.title,
            exp.category,
            f"{exp.amount:.2f}",
            exp.notes or ""
        ])

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"expense_report_{current_user.username}_{timestamp}.csv"

    csv_data = output.getvalue()
    output.close()

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8"
        }
    )
