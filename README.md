# Hostel Management SaaS

This repository contains a full-stack Hostel Management SaaS example.

Backend (server): Node.js + Express + Prisma + PostgreSQL
Frontend (client): React + Vite

Quick start

1. Backend

Install dependencies:

```bash
cd server
npm install
```

Set your environment in `server/.env` (DATABASE_URL, JWT_SECRET, Razorpay keys, mail credentials).

Run Prisma migrations (or generate client):

```bash
npx prisma generate
# npx prisma migrate dev --name init
```

Start server:

```bash
npm run dev
```

2. Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

Notes
- API base is configured via `client/.env` VITE_API_URL or defaults to `http://localhost:5000/api`.
- KYC uploads are stored in `uploads/kyc` relative to the repository root.
