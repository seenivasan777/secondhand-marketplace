# Second-Hand Marketplace (OLX-style MVP)

## Stack
- React + Vite
- Node.js + Express
- MySQL 8
- JWT authentication
- Multer image upload

## 1. Requirements
Install Node.js LTS, MySQL 8, and MySQL Workbench.

## 2. Database
Open MySQL Workbench and run `database/schema.sql`.

## 3. Backend
Open a terminal:
```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```
Edit `backend/.env` with your MySQL username/password before starting.

Backend runs at http://localhost:5000

## 4. Frontend
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL, normally http://localhost:5173

## Demo accounts
Register a new account through the website. Do not use a hard-coded demo password.

## MVP features
- Register and login
- Browse/search/filter products
- Create product listing with image
- View product details and seller contact
- View and delete your own listings

## Important
This is a demo/MVP, not production-ready. Before real deployment add rate limiting, stronger validation, secure HTTPS cookies/token handling, image storage (cloud), moderation, and tests. Never commit `.env`.
