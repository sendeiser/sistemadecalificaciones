// server/routes/reports.js
const express = require('express');
const reportController = require('../controllers/reportController');
const citationController = require('../controllers/citationController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authMiddleware);

// GET /reports/grades?division_id=...&materia_id=...
router.get('/grades', reportController.generateGradeReport);

// GET /reports/json
router.get('/json', reportController.getGradeJSON);

// GET /reports/attendance?division_id=...&start_date=...&end_date=...
router.get('/attendance', reportController.getAttendanceStats);

// GET /reports/attendance-teacher?assignment_id=...&start_date=...&end_date=...
router.get('/attendance-teacher', reportController.getTeacherAttendanceStats);

// GET /reports/dashboard-stats
router.get('/dashboard-stats', reportController.getGeneralDashboardStats);

// GET /reports/at-risk
router.get('/at-risk', reportController.getStudentsAtRisk);

// PDF Reports
router.get('/bulletin', reportController.generateStudentBulletinPDF);
router.get('/bulletin/:studentId', reportController.generateStudentBulletinPDF);
router.get('/division/:assignmentId', reportController.generateDivisionReport);
router.get('/attendance/assignment/:assignmentId', reportController.generateAssignmentAttendancePDF);
router.get('/attendance/division/:divisionId', reportController.generateDivisionAttendancePDF);

// Citation PDF
router.post('/citation', citationController.generateCitationPDF);

module.exports = router;
