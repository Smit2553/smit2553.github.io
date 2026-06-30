import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminShell from "./AdminShell";
import styles from "./admin.module.css";
import {
  AdminApiError,
  deleteAdminPost,
  fetchAdminPosts,
  getAdminErrorMessage,
  logoutAdmin,
  type AdminPostSummary,
} from "../../lib/admin";
import { formatBlogDate } from "../../lib/blog";

type AdminPostsState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      posts: AdminPostSummary[];
    }
  | {
      status: "error";
      message: string;
    };

type AdminNotice = {
  kind: "error" | "success";
  message: string;
};

function readNotice(state: unknown): string | null {
  if (typeof state !== "object" || state === null || !("notice" in state)) {
    return null;
  }

  const notice = (state as { notice?: unknown }).notice;

  if (typeof notice !== "string" || notice.trim().length === 0) {
    return null;
  }

  return notice;
}

export default function AdminPostsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AdminPostsState>({ status: "loading" });
  const [notice, setNotice] = useState<AdminNotice | null>(() => {
    const initialNotice = readNotice(location.state);

    return initialNotice ? { kind: "success", message: initialNotice } : null;
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void (async () => {
      try {
        const posts = await fetchAdminPosts();

        if (active) {
          setState({ status: "ready", posts });
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof AdminApiError && error.status === 401) {
          navigate("/admin/login", {
            replace: true,
            state: { from: location.pathname },
          });
          return;
        }

        setState({ status: "error", message: getAdminErrorMessage(error) });
      }
    })();

    return () => {
      active = false;
    };
  }, [location.pathname, navigate, reloadToken]);

  const handleDelete = async (post: AdminPostSummary) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(post.id);
    setNotice(null);

    try {
      await deleteAdminPost(post.id);
      setNotice({ kind: "success", message: `Deleted "${post.title}".` });
      setReloadToken((value) => value + 1);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        navigate("/admin/login", {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }

      setNotice({ kind: "error", message: getAdminErrorMessage(error) });
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setNotice(null);

    try {
      await logoutAdmin();
      navigate("/admin/login", { replace: true });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      setNotice({ kind: "error", message: getAdminErrorMessage(error) });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const draftCount = state.status === "ready"
    ? state.posts.filter((post) => post.status === "draft").length
    : 0;
  const publishedCount = state.status === "ready"
    ? state.posts.filter((post) => post.status === "published").length
    : 0;

  return (
    <AdminShell
      actions={(
        <>
          <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/">
            View site
          </Link>
          <Link className={styles.button} to="/admin/posts/new">
            New post
          </Link>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            type="button"
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </>
      )}
      lead="Drafts stay private until published. Edit, publish, or delete from here."
      title="Posts"
    >
      <div className={styles.stack}>
        {notice ? (
          <div
            className={`${styles.notice} ${notice.kind === "error" ? styles.noticeError : styles.noticeSuccess}`}
            role="alert"
          >
            {notice.message}
          </div>
        ) : null}

        {state.status === "loading" ? (
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Loading posts...</h2>
            <p className={styles.sectionText}>Fetching the admin post list.</p>
          </section>
        ) : null}

        {state.status === "error" ? (
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Unable to load posts.</h2>
            <p className={styles.sectionText}>{state.message}</p>
            <div className={styles.formActions}>
              <button className={styles.button} onClick={() => setReloadToken((value) => value + 1)} type="button">
                Retry
              </button>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/">
                Back home
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === "ready" && state.posts.length === 0 ? (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No posts yet.</h2>
            <p className={styles.emptyText}>Start with a draft or publish the first article.</p>
            <div className={styles.formActions}>
              <Link className={styles.button} to="/admin/posts/new">
                New post
              </Link>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/">
                Back home
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === "ready" && state.posts.length > 0 ? (
          <>
            <p className={styles.listCount}>
              {draftCount} drafts, {publishedCount} published
            </p>

            <div className={styles.list}>
              {state.posts.map((post) => {
                const isDeleting = deletingId === post.id;
                const statusLabel = post.status === "published" ? "Published" : "Draft";
                const statusClass = post.status === "published" ? styles.badgePublished : styles.badgeDraft;

                return (
                  <article className={styles.postCard} key={post.id}>
                    <div className={styles.postHeader}>
                      <div className={styles.postCopy}>
                        <div className={styles.postMeta}>
                          <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
                          <code className={styles.slug}>{post.slug}</code>
                        </div>

                        <h2 className={styles.postTitle}>{post.title}</h2>
                      </div>

                      <div className={styles.postMeta}>
                        <span>Updated {formatBlogDate(post.updatedAt)}</span>
                        <span>{post.status === "published" ? `Published ${formatBlogDate(post.publishedAt ?? post.updatedAt)}` : "Draft"}</span>
                      </div>
                    </div>

                    {post.summary && post.summary.trim().length > 0 ? (
                      <p className={styles.postSummary}>{post.summary}</p>
                    ) : (
                      <p className={styles.postSummaryMuted}>No summary yet.</p>
                    )}

                    <div className={styles.postActions}>
                      <Link className={`${styles.button} ${styles.buttonSecondary}`} to={`/admin/posts/${encodeURIComponent(post.id)}/edit`}>
                        Edit
                      </Link>
                      {post.status === "published" ? (
                        <Link
                          className={`${styles.button} ${styles.buttonSecondary}`}
                          rel="noreferrer"
                          target="_blank"
                          to={`/blog/${encodeURIComponent(post.slug)}`}
                        >
                          View public
                        </Link>
                      ) : null}
                      <button
                        className={`${styles.button} ${styles.buttonDanger}`}
                        disabled={isDeleting}
                        onClick={() => void handleDelete(post)}
                        type="button"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
