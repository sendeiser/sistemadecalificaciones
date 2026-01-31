import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import GradeEntry from './pages/GradeEntry';
import ReportView from './pages/ReportView';
import Assignments from './pages/Assignments';
import SubjectManagement from './pages/SubjectManagement';
import StudentManagement from './pages/StudentManagement';
import DivisionManagement from './pages/DivisionManagement';
import DivisionEnrollment from './pages/DivisionEnrollment';
import Attendance from './pages/Attendance';
import PeriodManagement from './pages/PeriodManagement';
import GradeReport from './pages/GradeReport';
import AttendanceOverview from './pages/AttendanceOverview';
import AttendanceCapture from './components/AttendanceCapture';
import TeacherReports from './pages/TeacherReports';
import AdminAttendanceReport from './pages/AdminAttendanceReport';
import Welcome from './pages/Welcome';
import StudentReport from './pages/StudentReport';
import MassJustification from './pages/MassJustification';
import MobileJustification from './pages/MobileJustification';
import AttendanceAlerts from './pages/AttendanceAlerts';
import ParentDashboard from './pages/ParentDashboard';
import AttendanceDiscrepancies from './pages/AttendanceDiscrepancies';
import Calendar from './pages/Calendar';
import Announcements from './pages/Announcements';
import AdminUserManagement from './pages/AdminUserManagement';
import Messages from './pages/Messages';
import VerifyDocument from './pages/VerifyDocument';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
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
