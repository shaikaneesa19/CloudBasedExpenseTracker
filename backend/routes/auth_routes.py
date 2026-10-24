from flask import Blueprint, request
from models import db, User
from utils import (
    success_response,
    error_response,
    generate_jwt_token,
    token_required,
    validate_email_format,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    currency = data.get("currency", "USD").strip().upper()

    errors = {}
    if not username or len(username) < 3:
        errors["username"] = "Username must be at least 3 characters long."
    if not email or not validate_email_format(email):
        errors["email"] = "A valid email address is required."
    if not password or len(password) < 6:
        errors["password"] = "Password must be at least 6 characters long."

    if errors:
        return error_response("Validation failed", 400, errors=errors)

    if User.query.filter_by(username=username).first():
        return error_response("Username already taken. Please choose another.", 409)

    if User.query.filter_by(email=email).first():
        return error_response("An account with this email already exists.", 409)

    user = User(username=username, email=email, currency=currency or "USD")
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response("Database error while creating user account.", 500)

    token, expiry = generate_jwt_token(user)

    return success_response(
        data={
            "user": user.to_dict(),
            "token": token,
            "expires_at": expiry,
        },
        message="Registration successful",
        status_code=201
    )

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip() # can be email or username
    password = data.get("password", "")

    if not identifier or not password:
        return error_response("Username/Email and Password are required.", 400)

    # Search by email or username
    user = User.query.filter(
        (User.email == identifier.lower()) | (User.username == identifier)
    ).first()

    if not user or not user.check_password(password):
        return error_response("Invalid credentials. Please verify your email/username and password.", 401)

    token, expiry = generate_jwt_token(user)

    return success_response(
        data={
            "user": user.to_dict(),
            "token": token,
            "expires_at": expiry,
        },
        message="Login successful"
    )

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user: User):
    return success_response(
        data={"user": current_user.to_dict()},
        message="User profile retrieved"
    )

@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user: User):
    data = request.get_json() or {}
    currency = data.get("currency")
    if currency:
        current_user.currency = currency.strip().upper()
    
    try:
        db.session.commit()
        return success_response(data={"user": current_user.to_dict()}, message="Profile updated")
    except Exception:
        db.session.rollback()
        return error_response("Could not update profile", 500)
