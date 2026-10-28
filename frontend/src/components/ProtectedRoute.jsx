import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { homeFor } from "../utils/format";

// <Route element={<ProtectedRoute roles={["student"]} />}> ... </Route>
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="page-loading">Loading...</p>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return <Outlet />;
}
