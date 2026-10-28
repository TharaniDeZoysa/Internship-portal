import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { homeFor } from "../utils/format";

export default function Navbar() {
  const { user, isLoggedIn, role, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <span className="brand-icon">IP</span>
        InternConnect
      </Link>

      <nav className="nav-actions">
        <NavLink className="nav-link" to="/internships">
          Find Internships
        </NavLink>

        {isLoggedIn ? (
          <>
            <NavLink className="nav-link" to={homeFor(role)} end>
              {role === "student" ? "My Applications" : role === "company" ? "Dashboard" : "Admin"}
            </NavLink>
            {role === "company" && (
              <NavLink className="nav-link" to="/company/applicants">
                Applicants
              </NavLink>
            )}
            <NavLink className="nav-link" to="/profile">
              Profile
            </NavLink>
            <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
            <button className="nav-button outline" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link className="nav-button outline" to="/login">
              Log in
            </Link>
            <Link className="nav-button solid" to="/register">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
