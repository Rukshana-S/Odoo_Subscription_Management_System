# ⚡ BrightLoop Subscription Cloud

### A Full-Stack Subscription Management System

BrightLoop Subscription Cloud is a web-based subscription management platform designed to simplify customer management, product management, subscription lifecycles, quotations, invoice generation, GST calculations, and payment tracking.

The platform provides a centralized interface for administrators, staff members, and customers to manage subscription-related operations efficiently.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [User Roles](#-user-roles)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [Business Logic](#-business-logic)
- [Installation and Setup](#-installation-and-setup)
- [Running the Application](#-running-the-application)
- [API Modules](#-api-modules)
- [Testing](#-testing)
- [Security](#-security)
- [Demo Workflow](#-demo-workflow)
- [Future Enhancements](#-future-enhancements)
- [Contributors](#-contributors)

---

## 🚀 Project Overview

Managing recurring subscriptions manually can lead to billing errors, payment tracking difficulties, customer management issues, and inefficient business operations.

BrightLoop addresses these challenges by providing an integrated subscription management platform.

The application supports:

- Customer registration and management.
- Product and subscription plan management.
- Subscription creation and lifecycle tracking.
- Quotation generation and approval.
- Automated invoice generation.
- GST calculation and discount management.
- Partial and complete payment tracking.
- Role-based access control.
- Dashboard analytics and reports.

---

## 🎯 Objectives

- Centralize subscription and customer management.
- Automate recurring billing operations.
- Simplify invoice generation and payment reconciliation.
- Implement role-based authorization.
- Maintain consistent business records.
- Provide visibility into subscription and payment status.
- Support structured data persistence using PostgreSQL.

---

## ✨ Key Features

### 1. Authentication and Authorization

- User registration and login.
- Secure password hashing.
- JWT-based authentication.
- Logout and session management.
- Password change functionality.
- Forgot-password and reset-password workflows.
- Email verification support.
- Role-based access control.

### 2. Dashboard

- Total customer overview.
- Active subscription statistics.
- Revenue overview.
- Pending invoice tracking.
- Subscription and payment summaries.
- Business performance reports.

### 3. Customer Management

- Add new customers.
- View customer information.
- Update customer details.
- Search and filter customers.
- Customer-specific subscription and invoice records.

### 4. Product Management

- Create and manage products.
- Update product information.
- View available products.
- Manage product categories.
- Control product availability.

### 5. Subscription Plan Management

- Create subscription plans.
- Configure pricing and billing intervals.
- Support monthly, quarterly, half-yearly, and yearly plans.
- Update plan details.
- Manage plan availability.

### 6. Subscription Management

- Create subscriptions for customers.
- Assign subscription plans.
- Track subscription status.
- Calculate upcoming billing dates.
- Pause and resume subscriptions.
- Cancel subscriptions.
- Renew subscriptions.

### 7. Quotation Management

- Generate customer quotations.
- Calculate discounts and GST.
- Manage quotation statuses.
- Approve or reject quotations.
- Convert approved quotations into subscriptions.

### 8. Invoice and Billing Management

- Generate invoices.
- Calculate taxable amounts.
- Apply discounts.
- Calculate 18% GST.
- Track invoice due dates.
- Manage paid, unpaid, partially paid, and overdue invoices.

### 9. Payment Management

- Record customer payments.
- Support UPI, bank transfer, and card payment records.
- Handle partial payments.
- Track outstanding balances.
- Prevent overpayments.
- Maintain payment transaction references.

### 10. Discount Management

- Create discount coupons.
- Support percentage-based and fixed discounts.
- Validate coupon codes.
- Check coupon expiry.
- Track maximum usage limits.

### 11. Reports and Analytics

- Subscription statistics.
- Customer reports.
- Revenue summaries.
- Invoice and payment reports.
- Outstanding balance monitoring.

### 12. Settings and Profile Management

- View and update user profiles.
- Change passwords.
- Manage account preferences.
- View role-based access information.

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| Admin | System administration, staff management, customer management, products, plans, billing, reports and audit logs. |
| Staff | Manage customers, products, plans, quotations, subscriptions, invoices and payments according to permissions. |
| Customer | Access personal subscriptions, invoices, payment records and account settings. |

### Role-Based Access Control (RBAC)

Each role receives access only to the operations permitted for that role. Backend authorization validates permissions independently of frontend navigation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | Tailwind CSS / CSS |
| Backend | Node.js |
| Backend Framework | Express.js |
| Database | PostgreSQL 18 |
| Database Client | node-postgres (pg) |
| Authentication | JWT |
| Password Security | bcrypt |
| API Testing | Jest, Supertest, Postman |
| Database Management | pgAdmin 4 |
| Version Control | Git and GitHub |

---

## 🏗️ System Architecture

BrightLoop follows a client-server architecture.

```text
                USERS
                  |
                  v
           REACT FRONTEND
                  |
                  v
            API SERVICES
                  |
                  v
           EXPRESS SERVER
                  |
          -----------------
          |       |       |
         AUTH   ROUTES  SERVICES
          |       |       |
          -----------------
                  |
                  v
             DATABASE LAYER
                  |
                  v
              POSTGRESQL
                  |
          -------------------
          |         |       |
        USERS   CUSTOMERS  PRODUCTS
          |
      SUBSCRIPTIONS
          |
       QUOTATIONS
          |
        INVOICES
          |
        PAYMENTS
          |
       DISCOUNTS
          |
       AUDIT LOGS
```

### Application Data Flow

1. Users interact with the React frontend.
2. Frontend services send HTTP requests to Express REST APIs.
3. Backend middleware validates authentication and authorization.
4. Business services process the requested operations.
5. The database layer executes SQL queries.
6. PostgreSQL stores and retrieves application data.
7. API responses are returned to the frontend.

---

## 🗄️ Database Design

**Database Name:** `brightloop_db`

**Database:** PostgreSQL 18

### Main Database Tables

| Table | Purpose |
|---|---|
| users | Stores user accounts and roles. |
| customers | Stores customer details. |
| products | Stores product information. |
| plans | Stores subscription plans. |
| subscriptions | Stores customer subscriptions. |
| quotations | Stores quotations and approval status. |
| invoices | Stores billing and invoice details. |
| payments | Stores payment transactions. |
| discounts | Stores discount information. |
| refresh_tokens | Stores refresh token records. |
| password_reset_tokens | Stores password reset tokens. |
| email_verification_tokens | Stores email verification tokens. |
| audit_logs | Stores important system activities. |

### Sample Mock Data

The prepared PostgreSQL database contains demonstration records.

| Entity | Records |
|---|---:|
| Users | 14 |
| Customers | 10 |
| Products | 8 |
| Subscription Plans | 6 |
| Subscriptions | 15 |
| Quotations | 10 |
| Invoices | 15 |
| Payments | 20 |
| Discounts | 5 |
| Audit Logs | 10 |

### Sample Customer Data

| Name | City |
|---|---|
| Kavin | Chennai |
| Nila | Coimbatore |
| Hari | Madurai |
| Yazhini | Tiruchirappalli |
| Vimal | Salem |

All records are fictional demonstration data.

---

## 🔄 Subscription Lifecycle

```text
        DRAFT
          |
          v
      QUOTATION
          |
          v
      CONFIRMED
          |
          v
        ACTIVE
          |
       --------
       |      |
       v      v
     PAUSED  CANCELLED
       |
       v
     ACTIVE
```

The system supports:

- Draft subscription creation.
- Quotation preparation.
- Subscription confirmation.
- Activation.
- Temporary suspension.
- Resumption.
- Cancellation.

Cancelled subscriptions cannot be reactivated through the normal lifecycle transition.

---

## 🧮 Business Logic

### 1. GST Calculation

The application uses an 18% GST rate.

**Formula:**

```text
Taxable Amount = Subtotal - Discount

GST = Taxable Amount × 18%

Invoice Total = Taxable Amount + GST
```

**Example:**

```text
Subtotal       = ₹5,000
Discount       = ₹500

Taxable Amount = ₹4,500
GST (18%)      = ₹810

Invoice Total  = ₹5,310
```

### 2. Payment Reconciliation

```text
Balance Due = Invoice Total - Amount Paid
```

Example:

```text
Invoice Total = ₹5,310
First Payment = ₹2,000

Remaining Balance = ₹3,310

Invoice Status = Partially Paid
```

When the remaining balance is paid:

```text
Balance Due = ₹0
Invoice Status = Paid
```

Overpayments must be rejected by the backend.

### 3. Recurring Billing

Supported billing intervals:

- Monthly
- Quarterly
- Half-Yearly
- Yearly

The next billing date is calculated according to the selected subscription interval.

---

## ⚙️ Installation and Setup

### Prerequisites

Install:

- Node.js
- npm
- PostgreSQL 18
- pgAdmin 4
- Visual Studio Code
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/Rukshana-S/-Odoo_Subscription_Management_System.git
```

```bash
cd Subscription_Management_System
```

### Step 2: Install Dependencies

```bash
npm install
```

If the backend has a separate package configuration:

```bash
cd server
npm install
cd ..
```

### Step 3: Create PostgreSQL Database

1. Open pgAdmin 4.
2. Connect to your PostgreSQL server.
3. Right-click Databases.
4. Select Create → Database.
5. Enter:

```text
brightloop_db
```

6. Save the database.

### Step 4: Configure Environment Variables

Create a `.env` file using the project's environment configuration.

Example:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/brightloop_db

JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
```

Replace the password and secrets with your actual configuration.

Never upload `.env` to GitHub.

### Step 5: Run Database Migrations

```bash
npm run db:migrate
```

### Step 6: Insert Mock Data

```bash
npm run db:seed
```

### Step 7: Verify Database

```bash
npm run db:status
```

---

## ▶️ Running the Application

Open two terminals.

### Terminal 1 – Backend

```bash
node server/index.js
```

Backend:

```text
http://localhost:5000
```

### Terminal 2 – Frontend

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

Use the actual scripts defined in `package.json` if they differ.

---

## 🔌 API Modules

Base URL:

```text
http://localhost:5000/api
```

| Module | Main Endpoints |
|---|---|
| Authentication | `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/me` |
| Customers | `/customers`, `/customers/:id` |
| Products | `/products`, `/products/:id` |
| Plans | `/plans`, `/plans/:id` |
| Subscriptions | `/subscriptions`, `/subscriptions/:id/status` |
| Quotations | `/quotations`, `/quotations/:id/status` |
| Invoices | `/invoices`, `/invoices/:id/status` |
| Payments | `/payments` |
| Discounts | `/discounts`, `/discounts/validate` |
| Reports | `/reports/dashboard` |

Refer to the Express route implementations for the complete API contract and authorization requirements.

---

## 🧪 Testing

The project uses Jest and Supertest for backend testing.

### Run Automated Tests

```bash
npm test
```

### Run PostgreSQL Integration Tests

```bash
npm test -- --runInBand server/tests/postgres.test.js
```

### Build Frontend

```bash
npm run build
```

Previously reported test results:

| Test Suite | Test Cases |
|---|---:|
| backend.test.js | 36 |
| modules.test.js | 28 |
| postgres.test.js | 7 |
| **Total** | **71** |

Previously reported: 3 test suites passed and 71 test cases passed. These results should be revalidated after subsequent integration changes.

---

## 🔐 Security

The backend includes or is designed to support:

- Password hashing using bcrypt.
- JWT-based authentication.
- Refresh token management.
- Role-based authorization.
- Customer data isolation.
- API input validation.
- Rate limiting.
- Parameterized SQL queries.
- Unauthorized resource access protection.
- Audit logging.
- Session invalidation after password changes.

Sensitive environment variables and authentication secrets must remain outside version control.

---

## 🎥 Demo Workflow

The project demonstration video covers:

1. Introduction to BrightLoop Subscription Cloud.
2. User registration and login.
3. Admin dashboard overview.
4. Customer and product management.
5. Subscription plan management.
6. Subscription creation and lifecycle.
7. Quotation generation.
8. Invoice generation and GST calculation.
9. Payment recording and reconciliation.
10. PostgreSQL database verification.
11. Reports and analytics.

The demonstration should show actual database changes when presenting PostgreSQL integration.

---

## 🚀 Future Enhancements

- Automated recurring invoice scheduling.
- Payment gateway integration.
- Advanced financial analytics.
- Automated email and SMS notifications.
- PDF invoice generation.
- Subscription renewal reminders.
- Cloud deployment.
- Advanced reporting and data export.
- Multi-tenant enterprise support.

---

## 👩‍💻 Contributors

**Project Name:** BrightLoop Subscription Cloud

**GitHub Repository:** [Subscription Management System](https://github.com/Rukshana-S/-Odoo_Subscription_Management_System)

**Project Domain:** Subscription Management and Billing Automation

---

## 📄 License

This project is developed for educational and academic purposes.

---

<div align="center">

### ⚡ BrightLoop Subscription Cloud

**Simplifying subscriptions. Streamlining billing. Empowering businesses.**

</div>
