# 🚀 DEPLOYMENT GUIDE

## Task Manager - Free Deploy on Vercel + MongoDB Atlas

---

## STEP 1: Create GitHub Repository

### 1.1 Go to GitHub
- Open: https://github.com
- Sign in or create account
- Click **"+"** (top right) → **"New repository"**

### 1.2 Fill Details
- Repository name: `taskmanager`
- Description: `Task Manager App with User Auth`
- Select: **Public**
- Check: **"Add a README file"** (optional)
- Click **"Create repository"**

### 1.3 Push Your Code
After creating the repo, GitHub will show commands. Run:

```bash
cd "C:\Users\HP\Documents\taskmanager"

& "C:\Program Files\Git\bin\git.exe" branch -M main
& "C:\Program Files\Git\bin\git.exe" remote set-url origin https://github.com/YOUR_USERNAME/taskmanager.git
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

**Replace YOUR_USERNAME with your GitHub username!**

---

## STEP 2: Create Free MongoDB Database

### 2.1 Sign Up
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"**
3. Sign up with Google or Email

### 2.2 Create Cluster
1. Click **"Build a Database"**
2. Choose **FREE** tier (M0 Sandbox)
3. Select region closest to you (Mumbai/inAzure Central India)
4. Click **"Create"**
5. Wait 1-3 minutes for setup

### 2.3 Create Database User
1. Go to **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `taskadmin`
5. Password: `TaskManager123!` (remember this!)
6. Role: **"Read and write to any database"**
7. Click **"Add User"**

### 2.4 Allow All IP Addresses
1. Go to **Security** → **Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. Click **"Confirm"**

### 2.5 Get Connection String
1. Go to **Deployment** → **Database**
2. Click **"Connect"**
3. Choose **"Connect your application"**
4. Copy the connection string:

```
mongodb+srv://taskadmin:<PASSWORD>@cluster.xxxxx.mongodb.net/taskmanager
```

**Replace `<PASSWORD>` with your actual password!**

---

## STEP 3: Deploy Backend on Vercel

### 3.1 Sign Up
1. Go to: https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### 3.2 Import Project
1. Click **"New Project"**
2. Find your `taskmanager` repo in the list
3. Click **"Import"**

### 3.3 Configure Project
1. Framework Preset: **"Other"**
2. Root Directory: `.` (or leave as default)
3. Build Command: (leave empty)
4. Output Directory: `.` (or leave as default)

### 3.4 Add Environment Variables
Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://taskadmin:YOURPASSWORD@cluster.xxxxx.mongodb.net/taskmanager` |
| `JWT_SECRET` | `abcdefgh1234567890abcdefgh1234567890abcdefgh1234567890abcdefgh1234` |

**Generate your JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes
3. You'll see your URL: `https://taskmanager-xxxx.vercel.app`

**Copy this URL - this is your BACKEND API URL!**

---

## STEP 4: Deploy Frontend on Vercel

### 4.1 Update Frontend Code
Edit `index.html` line ~753:
```javascript
window.API_BASE_URL = 'https://taskmanager-xxxx.vercel.app';
```

### 4.2 Push Updated Code
```bash
cd "C:\Users\HP\Documents\taskmanager"
& "C:\Program Files\Git\bin\git.exe" add .
& "C:\Program Files\Git\bin\git.exe" commit -m "Update API URL for production"
& "C:\Program Files\Git\bin\git.exe" push
```

### 4.3 Deploy Frontend
1. Vercel Dashboard → **New Project**
2. Import same `taskmanager` repo
3. Framework: **"Other"**
4. Root Directory: `.`
5. Environment Variables:
   - `API_BASE_URL` = Your backend Vercel URL (e.g., `https://taskmanager-xxxx.vercel.app`)

6. Deploy!

**This is your FRONTEND URL - share this with users!**

---

## STEP 5: Generate QR Code

```bash
cd "C:\Users\HP\Documents\taskmanager"
set APP_URL=https://your-frontend-url.vercel.app
npm install
npm run qr
```

QR code will be saved as `taskmanager-qr.png`

---

## 📱 FINAL URLs

- **App URL:** `https://your-frontend.vercel.app` ← Share this!
- **API URL:** `https://your-backend.vercel.app` ← For developers
- **MongoDB:** Cloud database (free)

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Check your `MONGODB_URI` environment variable
- Make sure database user password is correct
- Verify IP whitelist includes `0.0.0.0/0`

### "API not working"
- Check Vercel function logs
- Verify environment variables are set
- Test API endpoint directly

### "CORS error"
- Make sure `ALLOWED_ORIGINS` includes your frontend URL

---

## ✅ Your App is Live!

Users can now:
1. Scan QR code to access your app
2. Register/login with email & password
3. Create and manage tasks
4. Track all activity logs

---

**Built with ❤️ by Prabhat Malviya**