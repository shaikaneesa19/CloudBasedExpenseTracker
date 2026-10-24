# 💳 Cloud-Based Expense Tracker

A full-stack financial management web application built with **React**, **Python Flask**, **SQLAlchemy**, and **Chart.js**. The application is architected for local SQLite development and seamless deployment to cloud platforms like **Amazon Web Services (AWS)**.

---

## 🚀 Key Features

1. **User Authentication & Security**:
   - Secure registration and login with bcrypt password hashing via Werkzeug.
   - Stateless JWT (JSON Web Tokens) with 24-hour expiration.
   - User data isolation (each user can strictly view, manage, and export only their own expenses and budgets).

2. **Expense Management**:
   - Full CRUD: Add, edit, view, and delete daily expenses.
   - Standard categories: **Food**, **Travel**, **Education**, **Shopping**, **Bills**, and **Others**.
   - Search by keyword (title/notes) and filter by category, month (YYYY-MM), or date ranges.
   - Instant **CSV Export** with formatted dates, categories, notes, and currency.

3. **Monthly Budgets & Proactive Warnings**:
   - Set monthly targets for overall spending and individual categories.
   - Dynamic real-time progress bars with color alerts:
     - 🟢 **Normal**: < 80% consumed.
     - 🟡 **Warning**: 80% – 99% consumed.
     - 🔴 **Exceeded**: ≥ 100% consumed with exact overdraft amount calculated.
   - Top dismissible alert banner on the dashboard.

4. **Interactive Financial Visualizations**:
   - **Category Breakdown Chart**: Interactive Doughnut chart powered by Chart.js.
   - **Monthly Spending Trend**: Multi-month interactive bar chart tracking history over time.

5. **Modern Dashboard UI**:
   - Responsive sidebar navigation with mobile toggle drawer.
   - KPI summary cards: This Month's Spend, Daily Average, Budget Consumed %, Top Category, and All-Time Spend.
   - Recent transactions table with action badges.
   - 1-Click demo account autofill for fast testing.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 (Vite) | Fast component-based UI |
| **Styling** | Vanilla CSS Design System | Custom dark slate palette with vibrant category accents |
| **Charts** | Chart.js | Canvas-based responsive interactive charts |
| **Icons** | Lucide React | Lightweight SVG icons |
| **Backend** | Python 3 Flask | RESTful API with modular Blueprints |
| **ORM / Database** | SQLAlchemy & SQLite | Local zero-config SQLite, cloud-ready for PostgreSQL/MySQL |
| **Authentication** | PyJWT & Werkzeug | Token-based auth & secure password hashing |
| **Cloud Deployment** | AWS Ready | EC2 / Elastic Beanstalk (Flask), S3 (React), RDS (PostgreSQL/MySQL) |

---

## 📂 Project Directory Structure

```
CloudBasedExpenseTracker/
├── backend/
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth_routes.py        # /api/auth (register, login, profile)
│   │   ├── expense_routes.py     # /api/expenses (CRUD, search, CSV export)
│   │   ├── budget_routes.py      # /api/budgets (monthly targets & warnings)
│   │   └── analytics_routes.py   # /api/analytics (dashboard KPI & trends)
│   ├── app.py                    # Flask application factory & CORS setup
│   ├── config.py                 # SQLite / AWS RDS environment config
│   ├── models.py                 # User, Expense, and Budget SQLAlchemy models
│   ├── utils.py                  # JWT decorators & input validators
│   ├── seed.py                   # Pre-populates demo user & realistic sample data
│   ├── wsgi.py                   # Production WSGI entry point
│   ├── application.py            # AWS Elastic Beanstalk entry point
│   ├── test_api.py               # Automated unit & integration test suite
│   ├── requirements.txt          # Python dependencies
│   └── .env.example              # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Charts/
│   │   │   │   ├── CategoryChart.jsx     # Doughnut chart
│   │   │   │   └── MonthlyTrendChart.jsx # Bar chart
│   │   │   ├── Sidebar.jsx               # Navigation drawer
│   │   │   ├── Navbar.jsx                # Header bar & quick actions
│   │   │   ├── SummaryCard.jsx           # Metric KPI cards
│   │   │   ├── ExpenseTable.jsx          # Filterable data table
│   │   │   ├── ExpenseModal.jsx          # Add/Edit transaction modal
│   │   │   ├── BudgetModal.jsx           # Budget creation modal
│   │   │   └── BudgetAlertBanner.jsx     # Over-budget warning banner
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global user authentication state
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx         # Summary metrics & charts
│   │   │   ├── ExpensesPage.jsx          # Expense records & CSV download
│   │   │   ├── BudgetsPage.jsx           # Target setting & progress bars
│   │   │   ├── AnalyticsPage.jsx         # Deep-dive distribution tables
│   │   │   ├── LoginPage.jsx             # Sign in with demo shortcut
│   │   │   └── RegisterPage.jsx          # Sign up with currency picker
│   │   ├── services/
│   │   │   └── api.js                    # Fetch client with JWT injection
│   │   ├── App.jsx                       # Tab router & state coordinator
│   │   ├── App.css                       # Modern layout & component styles
│   │   ├── index.css                     # Design tokens, typography & resets
│   │   └── main.jsx                      # React DOM mounting
│   ├── package.json
│   └── vite.config.js                    # Proxy configured to Flask backend:5000
├── .gitignore                            # Excludes venv, node_modules, .env, db
└── README.md                             # Documentation & AWS cloud instructions
```

---

## ⚡ Quick Start (Local Development)

Open **two separate Windows PowerShell terminals** in the `CloudBasedExpenseTracker` root directory:

### Terminal 1: Backend (Flask API)

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Activate virtual environment (already created)
.\venv\Scripts\Activate.ps1

# 3. (Optional) Run tests to verify API endpoints
python test_api.py

# 4. (Optional) Seed realistic sample data and demo account
python seed.py

# 5. Start the Flask REST API server
python app.py
```
> The backend server will be running on **`http://127.0.0.1:5000`**.

---

### Terminal 2: Frontend (React / Vite)

```powershell
# 1. Navigate to frontend directory
cd frontend

# 2. Start the Vite development server
npm run dev
```
> The frontend will be running on **`http://localhost:5173`**.

---

## 🔑 Demo Account Credentials

For quick evaluation, click the **"Fill Demo Credentials"** button on the Login page or use:
* **Email:** `demo@example.com`
* **Password:** `password123`

*(You can also register a brand new account with your own preferred currency: USD, EUR, GBP, INR, CAD, AUD, JPY)*

---

## ☁️ AWS Cloud Architecture & Deployment Guide

This application is built cloud-native, separating state (RDS database), computation (EC2 / Elastic Beanstalk), and static assets (S3 / CloudFront).

```
                      +-----------------------------+
                      |         User Browser        |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
   Static Web Assets (HTML/JS/CSS)                  REST API Calls (/api/*)
              |                                             |
              v                                             v
+-----------------------------+             +-------------------------------+
|       Amazon S3 Bucket      |             |    AWS Elastic Beanstalk      |
|  (or AWS Amplify / CloudFront)            |      or EC2 Linux Instance    |
+-----------------------------+             |       (Gunicorn + Flask)      |
                                            +---------------+---------------+
                                                            |
                                                   SQLAlchemy Connection
                                                            |
                                                            v
                                            +-------------------------------+
                                            |       Amazon RDS Instance     |
                                            |     (PostgreSQL or MySQL)     |
                                            +-------------------------------+
```

### 1. Database Layer: Amazon RDS (PostgreSQL or MySQL)
1. Go to the **AWS RDS Console** and select **Create Database**.
2. Choose **PostgreSQL** (or MySQL) and select the **Free Tier** template.
3. Set your DB instance identifier (e.g. `expense-tracker-db`), master username, and master password.
4. Under Connectivity, attach a Security Group allowing inbound traffic on port `5432` from your Elastic Beanstalk / EC2 security group.
5. Note the endpoint URL. In your backend environment, configure:
   ```env
   DATABASE_URL=postgresql://<username>:<password>@<rds-endpoint>:5432/<dbname>
   ```

### 2. Backend API Layer: AWS Elastic Beanstalk (or EC2)
1. In the **AWS Elastic Beanstalk Console**, create a new application named `ExpenseTracker-API`.
2. Select **Python 3.11/3.12** platform.
3. Zip the contents of the `backend/` folder (including `application.py`, `requirements.txt`, and `config.py`).
4. Upload the zip package. Elastic Beanstalk automatically detects `application.py` and runs the application using WSGI.
5. In **Configuration -> Environment Variables**, set:
   * `FLASK_ENV=production`
   * `SECRET_KEY=<generate-a-secure-random-string>`
   * `JWT_SECRET_KEY=<generate-a-secure-random-string>`
   * `DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname`
   * `CORS_ORIGINS=https://<your-s3-or-domain-url>`

### 3. Frontend Static Hosting: Amazon S3 & CloudFront
1. In the `frontend` folder, create the production build:
   ```powershell
   npm run build
   ```
2. In the **AWS S3 Console**, create a bucket (e.g. `my-expense-tracker-frontend`).
3. Enable **Static Website Hosting** under Bucket Properties, setting the index document to `index.html`.
4. Upload the files inside `frontend/dist/` directly into the bucket.
5. *(Recommended)* Connect the bucket to **Amazon CloudFront** for HTTPS and global CDN caching.

---

## 🧪 Testing

Automated tests verify database integrity, authentication flows, expense creation, category constraints, CSV generation, and budget alerts:

```powershell
cd backend
.\venv\Scripts\python test_api.py
```
Expected output:
```text
Ran 4 tests in 0.96s
OK
```
