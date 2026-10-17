import { BriefcaseBusiness, ChartNoAxesCombined, Headphones } from "lucide-react";
import JobAuth from "./JobAuth.jsx";
import "./LoginPage.css";

export default function LoginPage({ request, onAuthenticated, notice }) {
  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-intro" aria-label="App introduction">
          <span className="login-eyebrow">
            <BriefcaseBusiness size={16} aria-hidden="true" />
            YOUR NEXT OPPORTUNITY
          </span>

          <h1>Find Work That Fits Your Skills.</h1>
          <p>
            Explore software, data, and audio jobs. Save opportunities
            and track applications you submit.
          </p>

          <div className="login-track-list" aria-label="Career tracks">
            <span><BriefcaseBusiness size={17} aria-hidden="true" /> Software Engineering</span>
            <span><ChartNoAxesCombined size={17} aria-hidden="true" /> Data Analytics</span>
            <span><Headphones size={17} aria-hidden="true" /> Audio Production</span>
          </div>
        </section>

                <div className="login-card">
          {notice && <p role="status">{notice}</p>}
          <JobAuth request={request} onAuthenticated={onAuthenticated} />
        </div>
      </div>
    </main>
  );
}
