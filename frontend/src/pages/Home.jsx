import { Link } from "react-router-dom";
import InternshipCard from "../components/InternshipCard";
import { useAuth } from "../context/useAuth";
import { useApi } from "../hooks/useApi";
import { useSavedInternships } from "../hooks/useSavedInternships";
import { homeFor } from "../utils/format";

const STEPS = [
  ["1", "Build your profile", "Add your education, skills and upload your resume once."],
  ["2", "Apply in minutes", "Send your resume and a short cover letter to any open internship."],
  ["3", "Track every step", "Follow each application from Applied to Offered in your dashboard."],
];

export default function Home() {
  const { isLoggedIn, role } = useAuth();
  const { data, loading, error } = useApi("/internships?limit=6&sort=newest");
  const saved = useSavedInternships();
  const latest = data?.data ?? [];

  return (
    <main id="home">
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">YOUR CAREER STARTS HERE</span>
          <h1>
            Find an internship.
            <br />
            <span>Build your future.</span>
          </h1>
          <p>
            Discover internship opportunities, apply with your resume and track
            every application in one place. Companies can post roles and manage
            applicants.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/internships">
              Explore opportunities →
            </Link>
            {isLoggedIn ? (
              <Link className="secondary-button" to={homeFor(role)}>
                Go to my dashboard
              </Link>
            ) : (
              <Link className="secondary-button" to="/register">
                Create free account
              </Link>
            )}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-card">
            <span className="art-symbol">✦</span>
            <h3>Your next opportunity</h3>
            <p>Learn · Grow · Succeed</p>
            <div className="art-line" />
            <div className="art-line short" />
          </div>
        </div>
      </section>

      <section className="content">
        <div className="steps-grid">
          {STEPS.map(([number, title, text]) => (
            <div className="step-card" key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content alt">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LATEST</span>
            <h2>Newest internships</h2>
            <p>Fresh opportunities posted by companies.</p>
          </div>
          <Link className="secondary-button" to="/internships">
            View all
          </Link>
        </div>

        {error && <div className="notice error">{error}</div>}
        {loading && !data ? (
          <p className="empty-state">Loading internships...</p>
        ) : latest.length === 0 && !error ? (
          <p className="empty-state">No internships have been posted yet.</p>
        ) : (
          <div className="internship-grid">
            {latest.map((item) => (
              <InternshipCard
                key={item._id}
                item={item}
                saved={saved.ids.has(item._id)}
                onToggleSave={saved.isStudent ? saved.toggle : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {!isLoggedIn && (
        <section className="content">
          <div className="cta-banner">
            <div>
              <h2>Hiring interns?</h2>
              <p>Register your company, post internships and review applicants.</p>
            </div>
            <Link className="primary-button inverted" to="/register">
              Register as a company
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
