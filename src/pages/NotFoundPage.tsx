import { Link } from "react-router-dom";
import styles from "../components/blog/blog.module.css";

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <div className={styles.articleShell}>
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>404</p>
          <h1 className={styles.emptyTitle}>Page not found.</h1>
          <p className={styles.emptyText}>
            The page you requested does not exist or may have moved.
          </p>
          <div className={styles.emptyActions}>
            <Link className={styles.buttonLink} to="/">
              Back home
            </Link>
            <Link className={styles.buttonLink} to="/blog">
              View writing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
