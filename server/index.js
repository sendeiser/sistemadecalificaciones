require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
