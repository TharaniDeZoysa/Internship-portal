import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import "./App.css";
import "./portal.css";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Internships from "./pages/Internships";
import InternshipDetail from "./pages/InternshipDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import StudentDashboard from "./pages/StudentDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import InternshipForm from "./pages/InternshipForm";
import Applicants from "./pages/Applicants";
import AdminDashboard from "./pages/AdminDashboard";

// Login/Register are full-screen pages; everything else gets navbar + footer.
function MainLayout() {
  return (
    <div className="app">
      <Navbar />
      <Outlet />
      <footer>
        <strong>InternConnect</strong>
        <p>University Placement & Internship Portal</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/internships/:id" element={<InternshipDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route element={<ProtectedRoute roles={["student"]} />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
        </Route>

        <Route element={<ProtectedRoute roles={["company", "admin"]} />}>
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/internships/new" element={<InternshipForm />} />
          <Route path="/company/internships/:id/edit" element={<InternshipForm />} />
          <Route path="/company/applicants" element={<Applicants />} />
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
