// server/routes/reports.js
const express = require('express');
const { generateGradeReport, getGradeJSON, getAttendanceStats, getGeneralDashboardStats, generateStudentBulletinPDF, getStudentsAtRisk, getTeacherAttendanceStats } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

// GET /reports/grades?division_id=...&materia_id=...
router.get('/grades', generateGradeReport);

// GET /reports/grades-json
router.get('/grades-json', getGradeJSON);

// GET /reports/attendance?division_id=...&start_date=...&end_date=...
router.get('/attendance', getAttendanceStats);

// GET /reports/attendance-teacher?assignment_id=...&start_date=...&end_date=...
router.get('/attendance-teacher', getTeacherAttendanceStats);

// GET /reports/dashboard-stats
router.get('/dashboard-stats', getGeneralDashboardStats);

// GET /reports/at-risk
router.get('/at-risk', getStudentsAtRisk);

// PDF Reports
router.get('/bulletin', generateStudentBulletinPDF);
router.get('/bulletin/:studentId', generateStudentBulletinPDF);
router.get('/division/:assignmentId', require('../controllers/reportController').generateDivisionReport);
router.get('/attendance/assignment/:assignmentId', require('../controllers/reportController').generateAssignmentAttendancePDF);
router.get('/attendance/division/:divisionId', require('../controllers/reportController').generateDivisionAttendancePDF);

module.exports = router;
