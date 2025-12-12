const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3006;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user database with permissions
const users = {
  '1': {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin'],
    permissions: [
      'read', 'write', 'delete', 'admin', 
      'user_management', 'system_settings', 
      'reports', 'analytics', 'calendar', 
      'forms', 'tables', 'charts', 'ui_elements'
    ],
    profile: {
      department: 'IT Department',
      position: 'System Administrator',
      avatar: '/images/admin-avatar.jpg',
      lastLogin: '2024-12-12T10:30:00Z'
    }
  },
  '2': {
    id: '2',
    username: 'user',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    roles: ['user'],
    permissions: [
      'read', 'write', 'calendar', 'forms', 'tables', 'ui_elements'
    ],
    profile: {
      department: 'Sales Department',
      position: 'Sales Representative',
      avatar: '/images/user-avatar.jpg',
      lastLogin: '2024-12-12T09:15:00Z'
    }
  },
  '3': {
    id: '3',
    username: 'test',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    permissions: [
      'read', 'write', 'calendar', 'forms', 'tables', 'ui_elements'
    ],
    profile: {
      department: 'Testing Department',
      position: 'QA Tester',
      avatar: '/images/test-avatar.jpg',
      lastLogin: '2024-12-12T08:45:00Z'
    }
  },
  '4': {
    id: '4',
    username: 'manager',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User',
    roles: ['manager'],
    permissions: [
      'read', 'write', 'reports', 'analytics', 
      'calendar', 'forms', 'tables', 'charts', 'ui_elements'
    ],
    profile: {
      department: 'Management',
      position: 'Department Manager',
      avatar: '/images/manager-avatar.jpg',
      lastLogin: '2024-12-12T07:30:00Z'
    }
  },
  '5': {
    id: '5',
    username: 'viewer',
    email: 'viewer@example.com',
    firstName: 'Viewer',
    lastName: 'User',
    roles: ['viewer'],
    permissions: [
      'read', 'ui_elements'
    ],
    profile: {
      department: 'Guest',
      position: 'Read-only User',
      avatar: '/images/viewer-avatar.jpg',
      lastLogin: '2024-12-12T11:00:00Z'
    }
  }
};

// Mock credentials for login
const credentials = {
  'admin': { password: 'admin123', userId: '1' },
  'user': { password: 'user123', userId: '2' },
  'test': { password: '123456', userId: '3' },
  'manager': { password: 'manager123', userId: '4' },
  'viewer': { password: 'viewer123', userId: '5' }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Profile API Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      login: 'POST /auth/login',
      profile: 'GET /auth/profile/:id'
    }
  });
});

// Login endpoint
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Login attempt:', { username, password: '***' });

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required',
      error: 'Missing credentials'
    });
  }

  // Check credentials
  const userCred = credentials[username.toLowerCase()];
  if (!userCred || userCred.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
      error: 'Authentication failed'
    });
  }

  // Get user data
  const user = users[userCred.userId];
  if (!user) {
    return res.status(500).json({
      success: false,
      message: 'User data not found',
      error: 'Internal server error'
    });
  }

  // Generate mock JWT token
  const token = `jwt-token-${user.id}-${Date.now()}`;

  console.log('✅ Login successful for user:', user.username);

  // Return login response
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles
      },
      token: token,
      permissions: user.permissions
    }
  });
});

// Get user profile endpoint
app.get('/auth/profile/:id', (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;

  console.log('👤 Profile request for user ID:', id);
  console.log('👤 Authorization header:', authHeader ? 'Present' : 'Missing');

  // Validate user ID
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required',
      error: 'Missing user ID'
    });
  }

  // Get user data
  const user = users[id];
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      error: `No user found with ID: ${id}`
    });
  }

  console.log('✅ Profile found for user:', user.username);

  // Return user profile with permissions
  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      permissions: user.permissions,
      profile: user.profile
    }
  });
});

// List all users (for testing)
app.get('/auth/users', (req, res) => {
  const userList = Object.values(users).map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    permissionCount: user.permissions.length
  }));

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: userList
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Profile API Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /auth/login`);
  console.log(`   GET  /auth/profile/:id`);
  console.log(`   GET  /auth/users`);
  console.log(`\n👥 Available test users:`);
  Object.values(users).forEach(user => {
    const cred = Object.entries(credentials).find(([, c]) => c.userId === user.id);
    if (cred) {
      console.log(`   ${cred[0]} / ${cred[1].password} (${user.roles.join(', ')}) - ${user.permissions.length} permissions`);
    }
  });
});

module.exports = app;