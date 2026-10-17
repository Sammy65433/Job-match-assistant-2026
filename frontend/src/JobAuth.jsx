import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let scriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load Google sign-in."));
      document.head.appendChild(script);
    }).catch((error) => {
      scriptPromise = null;
      throw error;
    });
  }

  return scriptPromise;
}

export default function JobAuth({ onAuthenticated, request }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let active = true;

    async function initializeGoogle() {
      try {
        await loadGoogleScript();
        if (!active || !googleButtonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          callback: async ({ credential }) => {
            if (!credential || !active) return;

            setBusy(true);
            setError("");

            try {
              const data = await request("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential })
              });

              if (active) {
                setPassword("");
                onAuthenticated(data);
              }
            } catch (err) {
              if (active) setError(err.message);
            } finally {
              if (active) setBusy(false);
            }
          }
        });

        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill"
        });
      } catch (err) {
        if (active) setError(err.message);
      }
    }

    void initializeGoogle();

    return () => {
      active = false;
    };
  }, [onAuthenticated, request]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const data = await request(
        mode === "login" ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        }
      );
      setPassword("");
      onAuthenticated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Job account">
      <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>

      <form onSubmit={submit}>
        <label htmlFor="job-email">Email</label>
        <input
          id="job-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="job-password">Password</label>
        <input
          id="job-password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 12 : undefined}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword
            ? <EyeOff size={18} aria-hidden="true" />
            : <Eye size={18} aria-hidden="true" />}
          {showPassword ? "Hide password" : "Show password"}
        </button>

        <button type="submit" disabled={busy}>
          {mode === "login"
            ? <LogIn size={18} aria-hidden="true" />
            : <UserPlus size={18} aria-hidden="true" />}
          {busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setPassword("");
          setShowPassword(false);
          setError("");
        }}
      >
        {mode === "login"
          ? "Create an account"
          : "Already have an account?"}
      </button>

      <p>Or continue with Google</p>
      <div ref={googleButtonRef} />

      {error && <p role="alert" className="error">{error}</p>}
    </section>
  );
}
