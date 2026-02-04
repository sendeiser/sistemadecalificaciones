import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

// Lazy load all page components for better performance
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GradeEntry = lazy(() => import('./pages/GradeEntry'));
const ReportView = lazy(() => import('./pages/ReportView'));
const Assignments = lazy(() => import('./pages/Assignments'));
const SubjectManagement = lazy(() => import('./pages/SubjectManagement'));
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const DivisionManagement = lazy(() => import('./pages/DivisionManagement'));
const DivisionEnrollment = lazy(() => import('./pages/DivisionEnrollment'));
const Attendance = lazy(() => import('./pages/Attendance'));
const PeriodManagement = lazy(() => import('./pages/PeriodManagement'));
const GradeReport = lazy(() => import('./pages/GradeReport'));
const AttendanceOverview = lazy(() => import('./pages/AttendanceOverview'));
const AttendanceCapture = lazy(() => import('./components/AttendanceCapture'));
const TeacherReports = lazy(() => import('./pages/TeacherReports'));
const AdminAttendanceReport = lazy(() => import('./pages/AdminAttendanceReport'));
const Welcome = lazy(() => import('./pages/Welcome'));
const StudentReport = lazy(() => import('./pages/StudentReport'));
const MassJustification = lazy(() => import('./pages/MassJustification'));
const MobileJustification = lazy(() => import('./pages/MobileJustification'));
const AttendanceAlerts = lazy(() => import('./pages/AttendanceAlerts'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const AttendanceDiscrepancies = lazy(() => import('./pages/AttendanceDiscrepancies'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Announcements = lazy(() => import('./pages/Announcements'));
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'));
const Messages = lazy(() => import('./pages/Messages'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const VerifyDocument = lazy(() => import('./pages/VerifyDocument'));
const UserSettings = lazy(() => import('./pages/UserSettings'));

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-tech-primary text-tech-text p-8 space-y-4">
        <div className="w-full max-w-md space-y-4 animate-pulse">
          <div className="h-8 bg-tech-surface rounded w-3/4 mx-auto"></div>
          <div className="h-32 bg-tech-surface rounded w-full"></div>
          <div className="h-4 bg-tech-surface rounded w-full"></div>
          <div className="h-4 bg-tech-surface rounded w-5/6"></div>
        </div>
        <p className="text-tech-muted font-mono text-sm uppercase tracking-widest mt-4">Accesando terminal segura...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AuthRedirect = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-tech-primary">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-tech-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-tech-muted font-mono text-sm uppercase tracking-widest">Cargando módulo...</p>
        </div>
      </div>
    }>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={
            <AuthRedirect>
              <PageTransition><Login /></PageTransition>
            </AuthRedirect>
          } />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/" element={<PageTransition><Welcome /></PageTransition>} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PageTransition><Dashboard /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/grades" element={
            <ProtectedRoute>
              <PageTransition><GradeEntry /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/assignments" element={
            <ProtectedRoute>
              <PageTransition><Assignments /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/subjects" element={
            <ProtectedRoute>
              <PageTransition><SubjectManagement /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute>
              <PageTransition><StudentManagement /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <PageTransition><ReportView /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/divisions" element={
            <ProtectedRoute>
              <PageTransition><DivisionManagement /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/enrollment" element={
            <ProtectedRoute>
              <PageTransition><DivisionEnrollment /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute>
              <PageTransition><Attendance /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/periods" element={
            <ProtectedRoute>
              <PageTransition><PeriodManagement /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute>
              <PageTransition><GradeReport /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-stats" element={
            <ProtectedRoute>
              <PageTransition><AttendanceOverview /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-capture" element={
            <ProtectedRoute>
              <PageTransition><AttendanceCapture /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports/attendance" element={<ProtectedRoute allowedRoles={['admin', 'preceptor']}><PageTransition><AdminAttendanceReport /></PageTransition></ProtectedRoute>} />
          <Route path="/tutor" element={<ProtectedRoute allowedRoles={['tutor']}><PageTransition><ParentDashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/tutor/justification" element={<ProtectedRoute allowedRoles={['tutor']}><PageTransition><MobileJustification /></PageTransition></ProtectedRoute>} />
          <Route path="/teacher/reports" element={
            <ProtectedRoute>
              <PageTransition><TeacherReports /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/student/report" element={<ProtectedRoute allowedRoles={['admin', 'docente', 'alumno', 'preceptor', 'tutor']}><PageTransition><StudentReport /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/mass-justification" element={
            <ProtectedRoute>
              <PageTransition><MassJustification /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-alerts" element={
            <ProtectedRoute>
              <PageTransition><AttendanceAlerts /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-discrepancies" element={
            <ProtectedRoute>
              <PageTransition><AttendanceDiscrepancies /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <PageTransition><Calendar /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <PageTransition><Messages /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/announcements" element={
            <ProtectedRoute>
              <PageTransition><Announcements /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <PageTransition><AdminUserManagement /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageTransition><AuditLogs /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <PageTransition><UserSettings /></PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/verify/:hash" element={<PageTransition><VerifyDocument /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
