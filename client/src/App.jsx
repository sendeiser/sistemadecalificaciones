import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import MainLayout from './components/MainLayout';

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
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { session, profile, loading } = useAuth();

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

  if (allowedRoles && profile && !allowedRoles.includes(profile.rol)) {
    return <Navigate to="/dashboard" replace />;
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
              <MainLayout><PageTransition><Dashboard /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/grades" element={
            <ProtectedRoute allowedRoles={['docente']}>
              <MainLayout><PageTransition><GradeEntry /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assignments" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><Assignments /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/subjects" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><SubjectManagement /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><StudentManagement /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><ReportView /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/divisions" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><DivisionManagement /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/enrollment" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><DivisionEnrollment /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['docente']}>
              <MainLayout><PageTransition><Attendance /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/periods" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><PeriodManagement /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><GradeReport /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-stats" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><AttendanceOverview /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-capture" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><AttendanceCapture /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports/attendance" element={<ProtectedRoute allowedRoles={['admin', 'preceptor']}><MainLayout><PageTransition><AdminAttendanceReport /></PageTransition></MainLayout></ProtectedRoute>} />
          <Route path="/tutor" element={<ProtectedRoute allowedRoles={['tutor']}><MainLayout><PageTransition><ParentDashboard /></PageTransition></MainLayout></ProtectedRoute>} />
          <Route path="/tutor/justification" element={<ProtectedRoute allowedRoles={['tutor']}><MainLayout><PageTransition><MobileJustification /></PageTransition></MainLayout></ProtectedRoute>} />
          <Route path="/teacher/reports" element={
            <ProtectedRoute allowedRoles={['docente']}>
              <MainLayout><PageTransition><TeacherReports /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/report" element={<ProtectedRoute allowedRoles={['admin', 'docente', 'alumno', 'preceptor', 'tutor']}><MainLayout><PageTransition><StudentReport /></PageTransition></MainLayout></ProtectedRoute>} />
          <Route path="/admin/mass-justification" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><MassJustification /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-alerts" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><AttendanceAlerts /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance-discrepancies" element={
            <ProtectedRoute allowedRoles={['admin', 'preceptor']}>
              <MainLayout><PageTransition><AttendanceDiscrepancies /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <MainLayout><PageTransition><Calendar /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <MainLayout><PageTransition><Messages /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/announcements" element={
            <ProtectedRoute>
              <MainLayout><PageTransition><Announcements /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MainLayout><PageTransition><AdminUserManagement /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MainLayout><PageTransition><AuditLogs /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout><PageTransition><UserSettings /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/help" element={
            <ProtectedRoute>
              <MainLayout><PageTransition><HelpCenter /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/system-settings" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MainLayout><PageTransition><SystemSettings /></PageTransition></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
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
