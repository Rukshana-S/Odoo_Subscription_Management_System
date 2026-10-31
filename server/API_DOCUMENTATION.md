# BRIGHTLOOP SUBSCRIPTION CLOUD – REST API DOCUMENTATION

This document defines the complete backend authentication, change password, profile management, and administrative API specifications.

---

## 1. Authentication Endpoints

### 1.1 User Registration (Public - Customer Only)
- **Method:** `POST`
- **URL:** `/api/auth/signup`
- **Auth Required:** No
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Kavin Kumar",
    "email": "kavin@chennaitech.in",
    "phone": "+91 98401 23456",
    "password": "SecurePassword@2024",
    "confirmPassword": "SecurePassword@2024",
    "termsAccepted": true
  }
  ```
- **Password Requirements:** > 8 characters, at least 1 uppercase, 1 lowercase, 1 special character (`!@#$%^&*...`).
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully. A verification link has been dispatched.",
    "user": {
      "id": "USER-1793425278978",
      "name": "Kavin",
      "fullName": "Kavin Kumar",
      "email": "kavin@chennaitech.in",
      "role": "Customer",
      "customerId": "CUST-382",
      "emailVerified": false
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Missing fields, invalid email format, weak password, or password mismatch.
  - `409 Conflict`: "An account with this corporate email address already exists."

---

### 1.2 User Login
- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "arul@brightloop.in",
    "password": "Arul@12345",
    "rememberMe": true
  }
  ```
- **Success Response (200 OK):**
  - Sets HTTP-Only cookies: `accessToken` (15m) and `refreshToken` (7d).
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "USER-ADMIN-01",
      "name": "Arul",
      "fullName": "Arul Selvan",
      "email": "arul@brightloop.in",
      "role": "Admin",
      "customerId": null,
      "emailVerified": true,
      "avatar": "https://..."
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: "Please provide corporate email and password."
  - `401 Unauthorized`: "Invalid corporate email or password."
  - `403 Forbidden`: "Account has been deactivated. Please contact your system administrator."
  - `429 Too Many Requests`: Triggered if rate limit exceeded (>100 requests in 15 mins).

---

### 1.3 User Logout
- **Method:** `POST`
- **URL:** `/api/auth/logout`
- **Auth Required:** No (reads cookie or body)
- **Request Body:** `{ "refreshToken": "..." }` (optional if cookie is passed)
- **Success Response (200 OK):**
  - Clears `accessToken` and `refreshToken` cookies, revokes token in database.
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

### 1.4 Refresh Token Rotation
- **Method:** `POST`
- **URL:** `/api/auth/refresh`
- **Auth Required:** No (reads cookie or body)
- **Success Response (200 OK):**
  - Rotates refresh token, issues new access token.
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "USER-ADMIN-01",
      "name": "Arul",
      "email": "arul@brightloop.in",
      "role": "Admin"
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: Refresh token not found.
  - `403 Forbidden`: Token invalid, expired, or revoked.

---

### 1.5 Forgot Password
- **Method:** `POST`
- **URL:** `/api/auth/forgot-password`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "kavin@chennaitech.in"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, password reset instructions have been dispatched."
  }
  ```

---

### 1.6 Reset Password
- **Method:** `POST`
- **URL:** `/api/auth/reset-password`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "token": "d748f9...",
    "newPassword": "BrandNewSecure@2025",
    "confirmNewPassword": "BrandNewSecure@2025"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset successfully. All compromised sessions have been revoked."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Expired/invalid token, password mismatch, or weak password policy violation.

---

### 1.7 Email Verification
- **Method:** `POST`
- **URL:** `/api/auth/verify-email`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "token": "c89b21..."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Email address verified successfully. Your client account is fully active."
  }
  ```

---

## 2. Profile Management

### 2.1 Get Authenticated Profile
- **Method:** `GET`
- **URL:** `/api/auth/me`
- **Auth Required:** Yes (`Bearer <token>` or cookie)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": "USER-ADMIN-01",
      "name": "Arul",
      "fullName": "Arul Selvan",
      "email": "arul@brightloop.in",
      "phone": "+91 98400 11223",
      "role": "Admin",
      "customerId": null,
      "emailVerified": true,
      "accountStatus": "Active",
      "createdAt": "2026-10-31T05:20:23.208Z",
      "lastLoginAt": "2026-10-31T05:41:00.000Z"
    }
  }
  ```

### 2.2 Update Authenticated Profile
- **Method:** `PUT`
- **URL:** `/api/auth/profile`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "name": "Arul Selvan",
    "email": "arul.selvan@brightloop.in",
    "phone": "+91 98400 11223"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "user": {
      "id": "USER-ADMIN-01",
      "name": "Arul",
      "fullName": "Arul Selvan",
      "email": "arul.selvan@brightloop.in",
      "phone": "+91 98400 11223",
      "role": "Admin",
      "updatedAt": "2026-10-31T05:42:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `409 Conflict`: Email address in use by another account.

---

## 3. Change Password Specification

### 3.1 Change Password Endpoint
- **Method:** `PATCH`
- **URL:** `/api/auth/change-password`
- **Auth Required:** Yes (`Bearer <token>` or cookie)
- **Request Body:**
  ```json
  {
    "currentPassword": "CurrentPassword@123",
    "newPassword": "BrandNewPassword@2025",
    "confirmPassword": "BrandNewPassword@2025"
  }
  ```
- **Validations Enforced:**
  1. Authenticates current user identity.
  2. Verifies `currentPassword` against bcrypt hash. Returns `400` if incorrect.
  3. Enforces strong password policy on `newPassword`.
  4. Ensures `newPassword === confirmPassword`.
  5. Prevents reusing current password as new password.
  6. Hashes `newPassword` with `bcrypt.genSalt(10)`.
  7. Invalidates all active refresh tokens and clears session cookies.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password changed successfully. All previous active sessions have been invalidated."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`:
    - "All password fields (currentPassword, newPassword, confirmPassword) are required."
    - "Current password provided is incorrect."
    - "New password and confirmation password do not match."
    - "New password cannot be identical to your current password."
    - "Password must be greater than 8 characters" / policy failure.
  - `401 Unauthorized`: No authentication token provided.

---

## 4. Teammate Database Coordination Note

The backend service coordinates with your teammate's existing database layer:
- **Connection & Persistence:** Reuses `server/db.js` (`getDb()`, `saveDb()`, `logAudit()`).
- **User Record Schema:**
  - `id`: Unique user identifier (`USER-...`)
  - `name`: First name for consistent display
  - `fullName`: Full user name
  - `email`: Normalized corporate email
  - `phone`: Contact phone number
  - `passwordHash`: bcrypt hashed string (never exposed in API outputs)
  - `role`: Role enum (`Admin` | `Staff` | `Customer`)
  - `customerId`: Link to customer account (if role is Customer)
  - `emailVerified`: Boolean status
  - `accountStatus`: Status (`Active` | `Suspended`)
  - `createdAt`, `updatedAt`, `lastLoginAt`
