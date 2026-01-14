// server/routes/reports.js
const express = require('express');
const { generateGradeReport, getAttendanceStats } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

// GET /reports/grades?division_id=...&materia_id=...
router.get('/grades', generateGradeReport);

// GET /reports/attendance?division_id=...&start_date=...&end_date=...
router.get('/attendance', getAttendanceStats);

// GET /reports/division/:assignmentId
router.get('/division/:assignmentId', require('../controllers/reportController').generateDivisionReport);

module.exports = router;
