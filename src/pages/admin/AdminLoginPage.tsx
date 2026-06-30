import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminShell from "./AdminShell";
import styles from "./admin.module.css";
import { AdminApiError, fetchAdminHealth, getAdminErrorMessage, getAdminReturnPath, loginAdmin } from "../../lib/admin";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getAdminReturnPath(location.state) ?? "/admin/posts";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await fetchAdminHealth();

        if (active) {
          navigate(returnPath, { replace: true });
        }
      } catch {
        // Stay on the login form if the session check fails.
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate, returnPath]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      await loginAdmin(username, password);
      navigate(returnPath, { replace: true });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        setMessage("Invalid username or password.");
      } else {
        setMessage(getAdminErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell
      actions={(
        <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/">
          Back home
        </Link>
      )}
      lead="Use the admin session cookie to manage drafts and published posts."
      title="Sign in"
    >
      <section className={`${styles.panel} ${styles.loginPanel}`}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {message ? (
            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
              {message}
            </div>
          ) : null}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-username">
              Username
            </label>
            <input
              autoComplete="username"
              className={styles.input}
              id="admin-username"
              name="username"
              onChange={(event) => setUsername(event.target.value)}
              required
              type="text"
              value={username}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className={styles.input}
              id="admin-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <div className={styles.formActions}>
            <button className={styles.button} disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}
