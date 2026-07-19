import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { friendlyError } from "../lib/errors";
import BrandMark from "./BrandMark";
import "../styles/theme.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Already signed in? Straight to the admin list.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        friendlyError(err, "Sign-in failed. Check your email and password."),
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="memory-page">
      <div className="memory-card">
        <BrandMark />
        <form onSubmit={handleSubmit}>
          <div className="memory-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="memory-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="memory-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="memory-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="memory-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {error && <p className="memory-error">{error}</p>}
      </div>
    </div>
  );
}

export default AdminLogin;
