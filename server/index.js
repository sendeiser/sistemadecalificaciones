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
app.use('/api/audit', require('./routes/audit'));
app.use('/api', require('./routes/auth-admin'));

// Redirect QR code scans to the frontend (Netlify)
app.get('/verify/:hash', (req, res) => {
  const { hash } = req.params;
  const host = req.get('host');

  // 1. Dev Redirect (Localhost)
  if (host.includes('localhost:5000')) {
    return res.redirect(`http://localhost:5173/verify/${hash}`);
  }

  // 2. Production Redirect (via FRONTEND_URL environment variable)
  if (process.env.FRONTEND_URL) {
    const baseUrl = process.env.FRONTEND_URL.replace(/\/$/, ""); // Remove trailing slash if present
    return res.redirect(`${baseUrl}/verify/${hash}`);
  }

  // 3. Fallback: Friendly alert if FRONTEND_URL is not set
  res.status(404).send(`
    <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
      <h2 style="color: #06b6d4;">Sistema de Verificación Edumate</h2>
      <p>Error: No se ha configurado la URL del frontend (FRONTEND_URL) en el servidor de Render.</p>
      <p>Hash del documento: <code>${hash}</code></p>
      <hr style="width: 200px; margin: 20px auto;">
      <p style="font-size: 12px; color: #666;">Por favor, configure FRONTEND_URL en el panel de Render.</p>
    </div>
  `);
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
