# 🚀 Quick Start Guide

Welcome to the Dating App project! Since you're new to programming, here are the simple steps to get everything running on your local machine.

## Prerequisites
- **Node.js** (Installed)
- **MongoDB** (Must be running locally. Usually starts automatically, or run `mongod`)

## 1. Start the Backend (Server)
This handles the database, API, and chat connections.

Open a terminal and run:
```bash
npm run start:backend
```
You should see: `✅ Environment validation passed!` and `Server running on port 3000`.

## 2. Start the Frontend (App)
This opens the visual part of the app (on your phone or browser).

Open a **new** terminal tab (keep the backend running!) and run:
```bash
npm start
```
Press `w` to open in the web browser, or scan the QR code with your phone (Expo Go app).

## 3. Populate Test Data (Optional)
If your database is empty, you can instantly create a test user (`test@example.com` / `password123`) and a match.

In a terminal, run:
```bash
npm run seed
```

## Troubleshooting
- **"Address in use" error**: Means the server is already running. Find it and stop it (Ctrl+C), or run `killall node` (careful, stops everything).
- **MongoDB connection failed**: Ensure MongoDB is installed and running (`sudo systemctl start mongod` on Linux usually).

Happy coding! 🎉
