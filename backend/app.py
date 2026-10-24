import os
import sys

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, jsonify
from flask_cors import CORS
from config import config_by_name
from models import db
from routes.auth_routes import auth_bp
from routes.expense_routes import expense_bp
from routes.budget_routes import budget_bp
from routes.analytics_routes import analytics_bp

def create_app(config_name=None):
    """Application factory for Cloud-Based Expense Tracker."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Initialize extensions
    db.init_app(app)

    # Enable CORS for all API routes (supports frontend port 5173/3000 or custom cloud origin)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(expense_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(analytics_bp)

    # Health check endpoint for AWS ALB / Elastic Beanstalk
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Cloud-Based Expense Tracker API",
            "environment": config_name,
            "database": "connected"
        }), 200

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "service": "Cloud-Based Expense Tracker API",
            "version": "1.0.0",
            "status": "online",
            "documentation": "/api/health"
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"status": "error", "message": "Resource or endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"status": "error", "message": "Internal server error occurred"}), 500

    # Ensure tables exist
    with app.app_context():
        db.create_all()

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1")
    print(f"[*] Cloud-Based Expense Tracker backend running on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
