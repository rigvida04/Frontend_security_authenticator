# Frontend_security_authenticator

A React + Vite frontend app for user-detail validation and cookie-safe authentication flow.

## Features

- Validates frontend user details:
  - Full name
  - Email
  - Employee ID (`EMP1234` pattern)
  - Password and confirm password
  - 6-digit OTP
- Performs authentication checks on the client side for demo purposes.
- Keeps session/auth state in memory only (no third-party cookies or persistent auth cookies).

## Demo credentials

- Employee ID: `EMP1234`
- Password: `password123`
- OTP: `123456`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
