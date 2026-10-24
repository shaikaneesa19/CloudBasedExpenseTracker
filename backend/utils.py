import re
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from models import db, User, VALID_CATEGORIES

def success_response(data=None, message="Success", status_code=200):
    payload = {"status": "success", "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status_code

def error_response(message="An error occurred", status_code=400, errors=None):
    payload = {"status": "error", "message": message}
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status_code

def generate_jwt_token(user: User):
    """Generate a signed JWT token with expiry."""
    expiration = datetime.now(timezone.utc) + current_app.config.get(
        "JWT_ACCESS_TOKEN_EXPIRES", timedelta(hours=24)
    )
    payload = {
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    secret = current_app.config["JWT_SECRET_KEY"]
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token, expiration.isoformat()

def token_required(f):
    """Decorator to enforce and verify JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return error_response("Authorization header missing", 401)

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return error_response("Invalid Authorization header format. Expected 'Bearer <token>'", 401)

        token = parts[1]
        try:
            secret = current_app.config["JWT_SECRET_KEY"]
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            user_id = payload.get("user_id")
            current_user = db.session.get(User, user_id)
            if not current_user:
                return error_response("User not found or account deactivated", 401)
        except jwt.ExpiredSignatureError:
            return error_response("Authentication token has expired. Please log in again.", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid authentication token", 401)
        except Exception as e:
            return error_response(f"Authentication error: {str(e)}", 401)

        return f(current_user, *args, **kwargs)
    return decorated

def validate_email_format(email: str) -> bool:
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(email_regex, email or ""))

def validate_date_format(date_str: str) -> bool:
    """Validate YYYY-MM-DD date."""
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False

def validate_month_format(month_str: str) -> bool:
    """Validate YYYY-MM format."""
    try:
        datetime.strptime(month_str, "%Y-%m")
        return True
    except (ValueError, TypeError):
        return False
