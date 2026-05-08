const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use(limiter);
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/taskmanager')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB Error:', err));

// ============================================
// USER MODEL
// For user authentication
// ============================================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ============================================
// TASK MODEL
// ============================================
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: 'todo' },
  priority: { type: String, default: 'medium' },
  project: { type: String, default: 'default' },
  dueDate: { type: Date, default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// ============================================
// PROJECT MODEL
// ============================================
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// ============================================
// ACTIVITY LOG MODEL
// Track user logins and task activities
// ============================================
const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', activitySchema);

activitySchema.index({ user: 1, createdAt: -1 });

function logActivity(userId, action, details, req) {
  const ip = req?.ip || req?.connection?.remoteAddress || '';
  const ua = req?.headers?.['user-agent'] || '';
  Activity.create({ user: userId, action, details, ipAddress: ip, userAgent: ua }).catch(() => {});
}

// ============================================
// AUTH MIDDLEWARE
// Verify JWT token
// ============================================
function authMiddleware(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid token format' });
  }

  const token = parts[1];

  try {
    if (token.length > 500) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================
// AUTH ROUTES
// ============================================

// Register new user
app.post('/api/auth/register', async function(req, res) {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email }, { username: username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      username: username,
      email: email,
      password: hashedPassword
    });

    await user.save();

    logActivity(user._id, 'REGISTER', `New user registered: ${email}`, req);

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/api/auth/login', authLimiter, async function(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logActivity(user._id, 'LOGIN_FAILED', `Failed login attempt for: ${email}`, req);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    logActivity(user._id, 'LOGIN', `User logged in: ${email}`, req);

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async function(req, res) {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    logActivity(req.userId, 'PROFILE_VIEW', 'Viewed profile', req);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout (client-side token removal, but we log it)
app.post('/api/auth/logout', authMiddleware, async function(req, res) {
  logActivity(req.userId, 'LOGOUT', 'User logged out', req);
  res.json({ message: 'Logged out successfully' });
});

// Password change
app.put('/api/auth/password', authMiddleware, async function(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      logActivity(req.userId, 'PASSWORD_CHANGE_FAILED', 'Failed password change attempt', req);
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    logActivity(req.userId, 'PASSWORD_CHANGED', 'User changed their password', req);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// TASK ROUTES (Protected)
// ============================================

// Get all tasks for current user
app.get('/api/tasks', authMiddleware, async function(req, res) {
  try {
    let { project, status, priority, search, sort } = req.query;
    const query = { user: req.userId };

    if (project) query.project = String(project).slice(0, 50);
    if (status && ['todo', 'inprogress', 'done'].includes(status)) query.status = status;
    if (priority && ['low', 'medium', 'high'].includes(priority)) query.priority = priority;
    if (search) {
      const safeSearch = String(search).slice(0, 100).replace(/[^\w\s]/g, '');
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'priority') sortOption = { priority: -1 };
    else if (sort === 'dueDate') sortOption = { dueDate: 1 };
    else if (sort === 'title') sortOption = { title: 1 };

    const tasks = await Task.find(query).sort(sortOption);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new task
app.post('/api/tasks', authMiddleware, async function(req, res) {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const status = String(req.body.status || 'todo').trim();
    const priority = String(req.body.priority || 'medium').trim();
    const project = String(req.body.project || 'default').trim();
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

    if (!title || title.length > 200) {
      return res.status(400).json({ error: 'Invalid title' });
    }

    if (description.length > 2000) {
      return res.status(400).json({ error: 'Description too long' });
    }

    if (!['todo', 'inprogress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const task = new Task({
      title,
      description,
      status,
      priority,
      project,
      dueDate,
      user: req.userId
    });

    await task.save();

    logActivity(req.userId, 'TASK_CREATED', `Created task: "${title}" in project: ${project}`, req);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update task
app.put('/api/tasks/:id', authMiddleware, async function(req, res) {
  try {
    const { title, description, status, priority, project, dueDate } = req.body;

    const updateFields = {};
    if (title !== undefined) {
      const t = String(title).trim();
      if (!t || t.length > 200) return res.status(400).json({ error: 'Invalid title' });
      updateFields.title = t;
    }
    if (description !== undefined) {
      const d = String(description).trim();
      if (d.length > 2000) return res.status(400).json({ error: 'Description too long' });
      updateFields.description = d;
    }
    if (status !== undefined && ['todo', 'inprogress', 'done'].includes(status)) {
      updateFields.status = status;
    }
    if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) {
      updateFields.priority = priority;
    }
    if (project !== undefined) {
      updateFields.project = String(project).trim();
    }
    if (dueDate !== undefined) {
      updateFields.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updateFields,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    logActivity(req.userId, 'TASK_UPDATED', `Updated task: "${task.title}"`, req);
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Delete task
app.delete('/api/tasks/:id', authMiddleware, async function(req, res) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    logActivity(req.userId, 'TASK_DELETED', `Deleted task: "${task.title}"`, req);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ACTIVITY LOG ROUTES
// ============================================

// Get all activities for current user
app.get('/api/activities', authMiddleware, async function(req, res) {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const activities = await Activity.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(parseInt(limit), 100));

    const total = await Activity.countDocuments({ user: req.userId });

    res.json({
      activities,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// PROJECT ROUTES (Protected)
// ============================================

// Get all projects
app.get('/api/projects', authMiddleware, async function(req, res) {
  try {
    const projects = await Project.find({ user: req.userId }).sort({ createdAt: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project
app.post('/api/projects', authMiddleware, async function(req, res) {
  try {
    const existing = await Project.findOne({ name: req.body.name, user: req.userId });
    if (existing) return res.status(400).json({ error: 'Project already exists' });

    const project = new Project(req.body);
    project.user = req.userId;
    await project.save();

    logActivity(req.userId, 'PROJECT_CREATED', `Created project: ${req.body.name}`, req);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete project
app.delete('/api/projects/:id', authMiddleware, async function(req, res) {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project.name, user: req.userId });

    logActivity(req.userId, 'PROJECT_DELETED', `Deleted project: ${project.name}`, req);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, function() {
  console.log('Server running on http://localhost:' + PORT);
});
