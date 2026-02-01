require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const gradesRoutes = require('./routes/grades');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/reports', require('./routes/reports'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/students', require('./routes/students'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/search', require('./routes/search'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/tutor', require('./routes/tutor'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api', require('./routes/auth-admin'));

// Redirect QR code scans ONLY on localhost for dev testing
// In production, the frontend handles /verify/:hash directly if it's a SPA
app.get('/verify/:hash', (req, res, next) => {
  const host = req.get('host');
  if (host.includes('localhost:5000')) {
    const { hash } = req.params;
    return res.redirect(`http://localhost:5173/verify/${hash}`);
  }
  // If not localhost:5000, let it pass (it might be handled by static serving or a 404)
  // CRITICAL: We don't res.redirect('/verify/...') here because it causes infinite loops
  next();
});

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from the client/dist folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA Fallback: Serve index.html for any route that doesn't match an API route
app.get('*', (req, res) => {
  // If the request is for an API route but reached here, it's a 404 for API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
