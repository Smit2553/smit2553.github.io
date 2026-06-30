import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminShell from "./AdminShell";
import styles from "./admin.module.css";
import {
  AdminApiError,
  deleteAdminReply,
  fetchAdminReplies,
  formatAdminTimestamp,
  getAdminErrorMessage,
  logoutAdmin,
  updateAdminReplyStatus,
  type AdminReply,
  type AdminReplyModerationStatus,
} from "../../lib/admin";

type AdminRepliesState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      replies: AdminReply[];
    }
  | {
      status: "error";
      message: string;
    };

type AdminNotice = {
  kind: "error" | "success";
  message: string;
};

function getReplyStatusLabel(status: AdminReply["status"]): string {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Pending";
}

function getReplyStatusClass(status: AdminReply["status"]): string {
  if (status === "approved") {
    return styles.badgePublished;
  }

  if (status === "rejected") {
    return styles.badgeRejected;
  }

  return styles.badgeDraft;
}

export default function AdminRepliesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AdminRepliesState>({ status: "loading" });
  const [notice, setNotice] = useState<AdminNotice | null>(null);
  const [updatingReplyId, setUpdatingReplyId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<AdminReplyModerationStatus | null>(null);
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void (async () => {
      try {
        const replies = await fetchAdminReplies();

        if (active) {
          setState({ status: "ready", replies });
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

  const handleModerateReply = async (reply: AdminReply, status: AdminReplyModerationStatus) => {
    setNotice(null);
    setUpdatingReplyId(reply.id);
    setUpdatingStatus(status);

    try {
      await updateAdminReplyStatus(reply.id, status);
      setNotice({
        kind: "success",
        message: `${status === "approved" ? "Approved" : "Rejected"} reply from "${reply.authorName}".`,
      });
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
      setUpdatingReplyId(null);
      setUpdatingStatus(null);
    }
  };

  const handleDeleteReply = async (reply: AdminReply) => {
    if (!window.confirm(`Delete the reply from "${reply.authorName}"? This cannot be undone.`)) {
      return;
    }

    setNotice(null);
    setDeletingReplyId(reply.id);

    try {
      await deleteAdminReply(reply.id);
      setNotice({ kind: "success", message: `Deleted reply from "${reply.authorName}".` });
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
      setDeletingReplyId(null);
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

  const pendingCount = state.status === "ready" ? state.replies.filter((reply) => reply.status === "pending").length : 0;
  const approvedCount = state.status === "ready" ? state.replies.filter((reply) => reply.status === "approved").length : 0;
  const rejectedCount = state.status === "ready" ? state.replies.filter((reply) => reply.status === "rejected").length : 0;

  return (
    <AdminShell
      actions={(
        <>
          <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/admin/posts">
            Back to posts
          </Link>
          <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/">
            View site
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
      lead="Review replies in context, approve the good ones, reject the rest, or delete spam."
      title="Replies"
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
            <h2 className={styles.sectionTitle}>Loading replies...</h2>
            <p className={styles.sectionText}>Fetching the moderation queue.</p>
          </section>
        ) : null}

        {state.status === "error" ? (
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>Unable to load replies.</h2>
            <p className={styles.sectionText}>{state.message}</p>
            <div className={styles.formActions}>
              <button className={styles.button} onClick={() => setReloadToken((value) => value + 1)} type="button">
                Retry
              </button>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/admin/posts">
                Back to posts
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === "ready" && state.replies.length === 0 ? (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No replies yet.</h2>
            <p className={styles.emptyText}>When readers leave replies, they will appear here for review.</p>
            <div className={styles.formActions}>
              <Link className={styles.button} to="/admin/posts">
                Back to posts
              </Link>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/">
                View site
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === "ready" && state.replies.length > 0 ? (
          <>
            <p className={styles.listCount}>
              {pendingCount} pending, {approvedCount} approved, {rejectedCount} rejected
            </p>

            <div className={styles.list}>
              {state.replies.map((reply) => {
                const isUpdating = updatingReplyId === reply.id;
                const isDeleting = deletingReplyId === reply.id;
                const statusLabel = getReplyStatusLabel(reply.status);
                const statusClass = getReplyStatusClass(reply.status);

                return (
                  <article className={styles.postCard} key={reply.id}>
                    <div className={styles.postHeader}>
                      <div className={styles.postCopy}>
                        <div className={styles.postMeta}>
                          <span className={`${styles.badge} ${statusClass}`}>{statusLabel}</span>
                        </div>

                        <h2 className={styles.postTitle}>{reply.authorName}</h2>

                        <div className={styles.postMeta}>
                          <span>On {reply.post.title}</span>
                          <code className={styles.slug}>{reply.post.slug}</code>
                          {reply.parentReplyId ? <span>Nested reply</span> : null}
                        </div>
                      </div>

                      <div className={styles.postMeta}>
                        <span>Created {formatAdminTimestamp(reply.createdAt)}</span>
                        <span>Updated {formatAdminTimestamp(reply.updatedAt)}</span>
                      </div>
                    </div>

                    <p className={styles.replyBody}>{reply.body}</p>

                    <div className={styles.postActions}>
                      {reply.status !== "approved" ? (
                        <button
                          className={styles.button}
                          disabled={isUpdating || isDeleting}
                          onClick={() => void handleModerateReply(reply, "approved")}
                          type="button"
                        >
                          {isUpdating && updatingStatus === "approved" ? "Approving..." : "Approve"}
                        </button>
                      ) : null}

                      {reply.status !== "rejected" ? (
                        <button
                          className={`${styles.button} ${styles.buttonDanger}`}
                          disabled={isUpdating || isDeleting}
                          onClick={() => void handleModerateReply(reply, "rejected")}
                          type="button"
                        >
                          {isUpdating && updatingStatus === "rejected" ? "Rejecting..." : "Reject"}
                        </button>
                      ) : null}

                      <button
                        className={`${styles.button} ${styles.buttonDanger}`}
                        disabled={isDeleting || isUpdating}
                        onClick={() => void handleDeleteReply(reply)}
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
