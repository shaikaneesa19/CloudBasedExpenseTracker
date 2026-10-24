"""
Automated unit and integration tests for Cloud-Based Expense Tracker Flask API.
Run with: python test_api.py
"""

import unittest
from app import create_app
from models import db, User, Expense, Budget

class ExpenseTrackerApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "healthy")

    def test_auth_flow(self):
        # Register user
        reg_res = self.client.post("/api/auth/register", json={
            "username": "tester",
            "email": "tester@example.com",
            "password": "securepassword123",
            "currency": "USD"
        })
        self.assertEqual(reg_res.status_code, 201)
        reg_data = reg_res.get_json()
        self.assertIn("token", reg_data["data"])
        token = reg_data["data"]["token"]

        # Login user
        login_res = self.client.post("/api/auth/login", json={
            "identifier": "tester@example.com",
            "password": "securepassword123"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertIn("token", login_data["data"])

        # Test auth me with token
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()["data"]["user"]["username"], "tester")

    def test_expense_crud_and_csv(self):
        # Register and get token
        reg_res = self.client.post("/api/auth/register", json={
            "username": "expenser",
            "email": "expenser@example.com",
            "password": "securepassword123",
            "currency": "USD"
        })
        token = reg_res.get_json()["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Add expense
        create_res = self.client.post("/api/expenses", headers=headers, json={
            "title": "Grocery Shopping",
            "amount": 75.50,
            "category": "Food",
            "date": "2026-10-15",
            "notes": "Apples, bread, milk"
        })
        self.assertEqual(create_res.status_code, 201)
        exp_id = create_res.get_json()["data"]["expense"]["id"]

        # List expenses
        list_res = self.client.get("/api/expenses", headers=headers)
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.get_json()["data"]["expenses"]), 1)

        # Update expense
        update_res = self.client.put(f"/api/expenses/{exp_id}", headers=headers, json={
            "title": "Supermarket Shopping",
            "amount": 80.00,
            "category": "Food",
            "date": "2026-10-15",
            "notes": "Updated items list"
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()["data"]["expense"]["amount"], 80.00)

        # Test CSV Export
        csv_res = self.client.get("/api/expenses/export/csv", headers=headers)
        self.assertEqual(csv_res.status_code, 200)
        self.assertIn(b"Supermarket Shopping", csv_res.data)

        # Delete expense
        del_res = self.client.delete(f"/api/expenses/{exp_id}", headers=headers)
        self.assertEqual(del_res.status_code, 200)

    def test_budget_and_warnings(self):
        reg_res = self.client.post("/api/auth/register", json={
            "username": "budgeter",
            "email": "budgeter@example.com",
            "password": "securepassword123"
        })
        token = reg_res.get_json()["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Set budget of 100 for Food in 2026-10
        b_res = self.client.post("/api/budgets", headers=headers, json={
            "category": "Food",
            "month": "2026-10",
            "amount": 100.00
        })
        self.assertEqual(b_res.status_code, 201)

        # Add expense exceeding budget (120 > 100)
        self.client.post("/api/expenses", headers=headers, json={
            "title": "Fancy Dinner",
            "amount": 120.00,
            "category": "Food",
            "date": "2026-10-05"
        })

        # Fetch budgets and verify exceeded status and warning
        get_b_res = self.client.get("/api/budgets?month=2026-10", headers=headers)
        self.assertEqual(get_b_res.status_code, 200)
        b_data = get_b_res.get_json()["data"]
        self.assertTrue(b_data["has_warnings"])
        self.assertEqual(b_data["budgets"][0]["status"], "exceeded")

if __name__ == "__main__":
    unittest.main()
