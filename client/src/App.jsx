import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tech-primary text-tech-text">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-cyan"></div>
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            } />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Welcome />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/grades" element={
              <ProtectedRoute>
                <GradeEntry />
              </ProtectedRoute>
            } />
            <Route path="/assignments" element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            } />
            <Route path="/subjects" element={
              <ProtectedRoute>
                <SubjectManagement />
              </ProtectedRoute>
            } />
            <Route path="/students" element={
              <ProtectedRoute>
                <StudentManagement />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <ReportView />
              </ProtectedRoute>
            } />
            <Route path="/divisions" element={
              <ProtectedRoute>
                <DivisionManagement />
              </ProtectedRoute>
            } />
            <Route path="/enrollment" element={
              <ProtectedRoute>
                <DivisionEnrollment />
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            } />
            <Route path="/periods" element={
              <ProtectedRoute>
                <PeriodManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute>
                <GradeReport />
              </ProtectedRoute>
            } />
            <Route path="/admin/attendance-stats" element={
              <ProtectedRoute>
                <AttendanceOverview />
              </ProtectedRoute>
            } />
            <Route path="/admin/attendance-capture" element={
              <ProtectedRoute>
                <AttendanceCapture />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports/attendance" element={
              <ProtectedRoute>
                <AdminAttendanceReport />
              </ProtectedRoute>
            } />
            <Route path="/teacher/reports" element={
              <ProtectedRoute>
                <TeacherReports />
              </ProtectedRoute>
            } />
            <Route path="/student/report" element={
              <ProtectedRoute>
                <StudentReport />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
