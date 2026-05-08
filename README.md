# Frontend Security Authenticator

A React-based frontend authentication system featuring two-factor authentication (password + OTP), route guards, JWT session management, and credential file import.

## Features

- 🔐 **Login Page** (`/login`) — Employee ID + password form with validation; supports manual entry **or** importing credentials from a `.txt`, `.json`, or `.csv` file
- 📱 **OTP Verification** (`/verify-otp`) — 6-digit segmented OTP input with paste support, a 60-second resend timer, and a "Resend OTP" button
- 🏠 **Dashboard** (`/dashboard`) — Protected members-only area displaying session info and JWT payload
- 🛡️ **Route Guards** — `PrivateRoute` prevents unauthenticated access to `/dashboard`; `GuestRoute` prevents re-entry to `/login` or `/verify-otp` once authenticated and blocks direct `/verify-otp` access without completing login first
- 🔑 **JWT Management** — Token stored in `sessionStorage`; HTTP interceptor (Axios) attaches `Authorization: Bearer <token>` header to all API requests
- ⚠️ **Error Handling** — Clear messages for invalid credentials, expired OTP, network errors, and too-many-attempts

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI framework |
| [Vite 6](https://vitejs.dev/) | Dev server & build tool |
| [React Router v6](https://reactrouter.com/) | Client-side routing |
| [Axios](https://axios-http.com/) | HTTP client with interceptor |

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start development server (proxies /api/* to http://localhost:8080)
npm run dev

# 3. Open http://localhost:3000
```

### Run automated tests

```bash
npm run test
```

### Build for production

```bash
npm run build
npm run preview
```

## Credential File Format

When using the **"Import from file"** tab on the login page, the file should contain:

**JSON** (`.json`):
```json
{ "empId": "EMP1234", "password": "yourpassword" }
```

**Plain-text** (`.txt` / `.csv`):
```
empId: EMP1234
password: yourpassword
```

## API Endpoints (expected backend)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/login` | Validates credentials, sends OTP |
| `POST` | `/api/verify-otp` | Validates OTP, returns JWT |
| `POST` | `/api/resend-otp` | Resends OTP (optional) |

### Expected request / response shapes

**POST /api/login**
```json
// Request
{ "empId": "EMP1234", "password": "secret" }

// 200 OK Response
{ "userId": "EMP1234", "transactionId": "txn-abc123", "message": "OTP sent" }
```

**POST /api/verify-otp**
```json
// Request
{ "userId": "EMP1234", "transactionId": "txn-abc123", "otp": "123456" }

// 200 OK Response
{ "token": "<JWT>", "message": "Authenticated" }
```

## Security Notes

- Passwords are **never** stored in component state after submission
- JWT stored in `sessionStorage` (cleared on tab close)
- No sensitive data is persisted to `localStorage`
