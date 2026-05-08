# My Task Manager

A full-stack task management app with user authentication, activity tracking, and real-time task management.

## Quick Start (Local)

```bash
npm install
node server.js
```
Open `index.html` in browser.

## Deploy on Vercel (Free)

### 1. Create MongoDB Atlas Database
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0)
3. Create database user
4. Add IP: `0.0.0.0/0`
5. Get connection string: `mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/taskmanager`

### 2. Deploy Backend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo (push to GitHub first)
3. Add environment variables:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = random 64-char string (use: `openssl rand -hex 64`)
4. Deploy

### 3. Deploy Frontend on Vercel
1. Create new Vercel project
2. Import the same repo
3. Set root directory to `./` for frontend
4. Add environment variable:
   - `API_BASE_URL` = your backend URL (e.g., `https://your-app.vercel.app`)
5. Deploy

### 4. Update index.html API URL
In frontend deployment, set `window.API_BASE_URL` to your backend URL before deploying.

## Features
- User authentication (register/login)
- Create, edit, delete tasks
- Multiple projects
- Priority levels & due dates
- Activity logging (all actions tracked)
- Search & filter
- Calendar view
- Export to CSV/Text

## Tech Stack
- **Frontend:** React, Babel (standalone)
- **Backend:** Node.js, Express (Vercel Serverless)
- **Database:** MongoDB Atlas
- **Deployment:** Vercel (free tier)