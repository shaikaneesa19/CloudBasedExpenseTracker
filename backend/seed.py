"""
Seed script to populate sample demo user, expenses, and budgets for Cloud-Based Expense Tracker.
Run with: python seed.py
"""

from datetime import datetime, timedelta
from app import create_app
from models import db, User, Expense, Budget, VALID_CATEGORIES

def seed_database():
    app = create_app("development")
    with app.app_context():
        print("[*] Initializing and seeding database...")
        db.create_all()

        # Check if demo user already exists
        demo_user = User.query.filter_by(email="demo@example.com").first()
        if not demo_user:
            demo_user = User(
                username="demouser",
                email="demo@example.com",
                currency="USD"
            )
            demo_user.set_password("password123")
            db.session.add(demo_user)
            db.session.commit()
            print("[+] Created Demo User: demo@example.com (Password: password123)")
        else:
            print("[i] Demo User already exists.")

        # Check if expenses exist
        existing_expenses = Expense.query.filter_by(user_id=demo_user.id).count()
        now = datetime.now()
        current_month = now.strftime("%Y-%m")
        prev_month_date = now.replace(day=1) - timedelta(days=5)
        prev_month = prev_month_date.strftime("%Y-%m")
        prev_2_month_date = prev_month_date.replace(day=1) - timedelta(days=5)
        prev_2_month = prev_2_month_date.strftime("%Y-%m")

        if existing_expenses == 0:
            sample_expenses = [
                # Current month expenses
                {"title": "Whole Foods Groceries", "amount": 142.50, "category": "Food", "days_ago": 1, "notes": "Weekly produce and pantry restock"},
                {"title": "Uber ride to Downtown Office", "amount": 28.75, "category": "Travel", "days_ago": 2, "notes": "Morning client meeting"},
                {"title": "Electric & Water Utility Bill", "amount": 185.20, "category": "Bills", "days_ago": 3, "notes": "Monthly utility bill payment"},
                {"title": "Amazon - Ergonomic Desk Chair", "amount": 219.99, "category": "Shopping", "days_ago": 5, "notes": "Home office upgrade"},
                {"title": "Coursera Python & Cloud Specialization", "amount": 79.00, "category": "Education", "days_ago": 6, "notes": "Cloud architecture certificate"},
                {"title": "Dinner with Friends at Olive Garden", "amount": 86.40, "category": "Food", "days_ago": 8, "notes": "Weekend celebration"},
                {"title": "High-Speed Fiber Internet", "amount": 69.99, "category": "Bills", "days_ago": 10, "notes": "Monthly home fiber internet"},
                {"title": "Subway & Metro Rail Pass", "amount": 65.00, "category": "Travel", "days_ago": 12, "notes": "Monthly transit pass"},
                {"title": "Running Shoes - Nike Store", "amount": 115.00, "category": "Shopping", "days_ago": 14, "notes": "Athletic footwear"},
                {"title": "Cloud Computing Reference Books", "amount": 54.50, "category": "Education", "days_ago": 16, "notes": "AWS Certified Solutions Architect guide"},
                {"title": "Pharmacy & Personal Care Items", "amount": 34.20, "category": "Others", "days_ago": 18, "notes": "Vitamins and first aid supplies"},
                {"title": "Coffee Shop & Snacks", "amount": 18.60, "category": "Food", "days_ago": 20, "notes": "Work session coffee"},

                # Previous month expenses
                {"title": "Monthly Grocery Haul", "amount": 380.00, "category": "Food", "date": f"{prev_month}-15", "notes": "Bulk warehouse groceries"},
                {"title": "Gasoline Fill-up", "amount": 55.40, "category": "Travel", "date": f"{prev_month}-18", "notes": "Commute fuel"},
                {"title": "Apartment Rent & Management", "amount": 1200.00, "category": "Bills", "date": f"{prev_month}-01", "notes": "Monthly residence lease"},
                {"title": "Mechanical Keyboard", "amount": 89.99, "category": "Shopping", "date": f"{prev_month}-10", "notes": "Keychron K2 wireless keyboard"},
                {"title": "Udemy AWS Cloud Practitioner Course", "amount": 19.99, "category": "Education", "date": f"{prev_month}-05", "notes": "Cloud basics online course"},
                {"title": "Mobile Phone Service Plan", "amount": 45.00, "category": "Bills", "date": f"{prev_month}-22", "notes": "Unlimited mobile data"},

                # 2 months ago expenses
                {"title": "Supermarket Shopping", "amount": 320.10, "category": "Food", "date": f"{prev_2_month}-12", "notes": "Groceries and household goods"},
                {"title": "Flight Ticket for Conference", "amount": 240.00, "category": "Travel", "date": f"{prev_2_month}-08", "notes": "Tech summit domestic flight"},
                {"title": "Software Engineering Textbook", "amount": 62.00, "category": "Education", "date": f"{prev_2_month}-20", "notes": "System design interview guide"},
                {"title": "Home Electricity Bill", "amount": 145.00, "category": "Bills", "date": f"{prev_2_month}-03", "notes": "Power utility bill"},
                {"title": "Winter Jacket & Clothing", "amount": 130.00, "category": "Shopping", "date": f"{prev_2_month}-25", "notes": "Winter apparel sale"}
            ]

            for item in sample_expenses:
                if "days_ago" in item:
                    item_date = (now - timedelta(days=item["days_ago"])).strftime("%Y-%m-%d")
                else:
                    item_date = item["date"]

                exp = Expense(
                    user_id=demo_user.id,
                    title=item["title"],
                    amount=item["amount"],
                    category=item["category"],
                    date=item_date,
                    notes=item.get("notes", "")
                )
                db.session.add(exp)

            db.session.commit()
            print(f"[+] Inserted {len(sample_expenses)} sample expenses for demo user.")
        else:
            print("[i] Expenses already exist for demo user.")

        # Seed Budgets for current month
        existing_budget = Budget.query.filter_by(user_id=demo_user.id, month=current_month).first()
        if not existing_budget:
            budgets = [
                Budget(user_id=demo_user.id, category="Total", month=current_month, amount=1800.0),
                Budget(user_id=demo_user.id, category="Food", month=current_month, amount=400.0),
                Budget(user_id=demo_user.id, category="Travel", month=current_month, amount=200.0),
                Budget(user_id=demo_user.id, category="Bills", month=current_month, amount=450.0),
                Budget(user_id=demo_user.id, category="Shopping", month=current_month, amount=300.0),
                Budget(user_id=demo_user.id, category="Education", month=current_month, amount=250.0),
                Budget(user_id=demo_user.id, category="Others", month=current_month, amount=150.0),
            ]
            db.session.add_all(budgets)
            db.session.commit()
            print(f"[+] Created monthly budgets for month {current_month}.")
        else:
            print("[i] Monthly budgets already configured for current month.")

        print("[*] Database ready and seeded successfully!")

if __name__ == "__main__":
    seed_database()
