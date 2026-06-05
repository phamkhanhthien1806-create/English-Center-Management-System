import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCoursesPage from "./pages/admin/CoursesPage";
import AdminClassesPage from "./pages/admin/ClassesPage";
import AdminStudentsPage from "./pages/admin/StudentsPage";
import AdminTeachersPage from "./pages/admin/TeachersPage";
import AdminEnrollmentsPage from "./pages/admin/EnrollmentsPage";
import AdminScoresPage from "./pages/admin/ScoresPage";
import AdminPaymentsPage from "./pages/admin/PaymentsPage";
import AdminNotificationsPage from "./pages/admin/NotificationsPage";
import StudentDashboard from "./pages/student/Dashboard";
import CoursesPage from "./pages/student/CoursesPage";
import CourseDetailPage from "./pages/student/CourseDetailPage";
import MyClassesPage from "./pages/student/MyClassesPage";
import LessonsPage from "./pages/student/LessonsPage";
import MySchedulePage from "./pages/student/MySchedulePage";
import MyScoresPage from "./pages/student/MyScoresPage";
import MyPaymentsPage from "./pages/student/MyPaymentsPage";
import ProfilePage from "./pages/student/ProfilePage";
import NotificationsPage from "./pages/student/NotificationsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin protected routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["quản trị viên"]}>
              <MainLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="courses" element={<AdminCoursesPage />} />
                  <Route path="classes" element={<AdminClassesPage />} />
                  <Route path="students" element={<AdminStudentsPage />} />
                  <Route path="teachers" element={<AdminTeachersPage />} />
                  <Route path="enrollments" element={<AdminEnrollmentsPage />} />
                  <Route path="scores" element={<AdminScoresPage />} />
                  <Route path="payments" element={<AdminPaymentsPage />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Student protected routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={["học viên"]}>
              <MainLayout>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="courses/:id" element={<CourseDetailPage />} />
                  <Route path="classes" element={<MyClassesPage />} />
                  <Route path="lessons/:classId" element={<LessonsPage />} />
                  <Route path="schedule" element={<MySchedulePage />} />
                  <Route path="scores" element={<MyScoresPage />} />
                  <Route path="payments" element={<MyPaymentsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route
                    path="*"
                    element={<Navigate to="/student/dashboard" replace />}
                  />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
