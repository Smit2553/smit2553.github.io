import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react";
import {
  fetchBlogReplies,
  formatBlogDate,
  getBlogErrorMessage,
  submitBlogReply,
  type BlogReply,
} from "../../lib/blog";
import styles from "./blog.module.css";

type BlogRepliesSectionProps = {
  slug: string;
  postTitle: string;
};

type RepliesState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      replies: BlogReply[];
    }
  | {
      status: "error";
      message: string;
    };

type SubmissionState =
  | {
      status: "idle";
    }
  | {
      status: "submitting";
    }
  | {
      status: "success";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export default function BlogRepliesSection({ postTitle, slug }: BlogRepliesSectionProps) {
  const sectionId = useId();
  const authorNameInputId = `${sectionId}-author-name`;
  const replyInputId = `${sectionId}-reply-body`;
  const [repliesState, setRepliesState] = useState<RepliesState>({ status: "loading" });
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ status: "idle" });
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [replyTarget, setReplyTarget] = useState<BlogReply | null>(null);

  useEffect(() => {
    let active = true;

    setRepliesState({ status: "loading" });
    setSubmissionState({ status: "idle" });
    setAuthorName("");
    setBody("");
    setReplyTarget(null);

    void (async () => {
      try {
        const replies = await fetchBlogReplies(slug);

        if (active) {
          setRepliesState({ status: "ready", replies });
        }
      } catch (error) {
        if (active) {
          setRepliesState({ status: "error", message: getBlogErrorMessage(error) });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  function clearSubmissionFeedback(): void {
    setSubmissionState((current) => (current.status === "submitting" ? current : { status: "idle" }));
  }

  function handleAuthorNameChange(event: ChangeEvent<HTMLInputElement>): void {
    setAuthorName(event.target.value);
    clearSubmissionFeedback();
  }

  function handleBodyChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    setBody(event.target.value);
    clearSubmissionFeedback();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submissionState.status === "submitting") {
      return;
    }

    const normalizedAuthorName = authorName.trim();
    const normalizedBody = body.trim();

    if (normalizedAuthorName.length === 0 || normalizedBody.length === 0) {
      setSubmissionState({ status: "error", message: "Enter your name and reply before submitting." });
      return;
    }

    setSubmissionState({ status: "submitting" });

    try {
      await submitBlogReply(slug, {
        authorName: normalizedAuthorName,
        body: normalizedBody,
        parentReplyId: replyTarget?.id ?? null,
      });

      setAuthorName("");
      setBody("");
      setReplyTarget(null);
      setSubmissionState({
        status: "success",
        message: "Thanks. Your reply is pending approval and will appear once it is approved.",
      });
    } catch (error) {
      setSubmissionState({ status: "error", message: getBlogErrorMessage(error) });
    }
  }

  const replies = repliesState.status === "ready" ? repliesState.replies : [];
  const rootReplies = replies.filter((reply) => reply.parentReplyId === null);

  function getChildReplies(parentReplyId: string): BlogReply[] {
    return replies.filter((reply) => reply.parentReplyId === parentReplyId);
  }

  return (
    <section className={styles.replySection} aria-labelledby={`${sectionId}-title`}>
      <div className={styles.replySectionHeader}>
        <p className={styles.eyebrow}>Conversation</p>
        <h2 className={styles.replySectionTitle} id={`${sectionId}-title`}>
          Replies
        </h2>
        <p className={styles.pageLead}>
          Approved replies to "{postTitle}" appear below. New replies and subreplies are submitted as plain text
          and stay pending approval until reviewed.
        </p>
      </div>

      <div className={styles.articleContent}>
        <form className={styles.replyForm} noValidate onSubmit={handleSubmit}>
          {replyTarget ? (
            <div className={styles.replyTargetCard} role="status">
              <p className={styles.replyTargetText}>
                Replying to <strong>{replyTarget.authorName}</strong>
              </p>
              <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setReplyTarget(null)} type="button">
                Cancel reply
              </button>
            </div>
          ) : null}

          {submissionState.status === "success" && (
            <div className={`${styles.notice} ${styles.noticeSuccess}`} role="status">
              {submissionState.message}
            </div>
          )}

          {submissionState.status === "error" && (
            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
              {submissionState.message}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor={authorNameInputId}>
              Your name
            </label>
            <input
              className={styles.input}
              id={authorNameInputId}
              maxLength={80}
              name="authorName"
              placeholder="Your name"
              spellCheck={false}
              type="text"
              value={authorName}
              onChange={handleAuthorNameChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={replyInputId}>
              {replyTarget ? "Subreply" : "Reply"}
            </label>
            <textarea
              className={styles.textarea}
              id={replyInputId}
              maxLength={4000}
              name="body"
              placeholder="Write a plain text reply..."
              rows={6}
              spellCheck
              value={body}
              onChange={handleBodyChange}
            />
            <p className={styles.helper}>Plain text only. Line breaks are preserved.</p>
          </div>

          <div className={styles.formActions}>
            <button className={styles.button} disabled={submissionState.status === "submitting"} type="submit">
              {submissionState.status === "submitting" ? "Submitting..." : replyTarget ? "Submit subreply" : "Submit reply"}
            </button>
          </div>
        </form>
      </div>

      {repliesState.status === "loading" && (
        <div className={styles.statusCard}>
          <h3 className={styles.statusTitle}>Loading replies...</h3>
          <p className={styles.statusText}>Fetching approved replies from the backend.</p>
        </div>
      )}

      {repliesState.status === "error" && (
        <div className={styles.statusCard}>
          <h3 className={styles.statusTitle}>Unable to load replies.</h3>
          <p className={styles.statusText}>{repliesState.message}</p>
        </div>
      )}

      {repliesState.status === "ready" && rootReplies.length === 0 && (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No approved replies yet.</h3>
          <p className={styles.emptyText}>
            Be the first to leave a reply. Anything submitted here will stay pending until approved.
          </p>
        </div>
      )}

      {repliesState.status === "ready" && rootReplies.length > 0 && (
        <div className={styles.replyList}>
          {rootReplies.map((reply) => {
            const childReplies = getChildReplies(reply.id);

            return (
              <article className={styles.replyThread} key={reply.id}>
                <div className={styles.replyCard}>
                  <div className={styles.articleMeta}>
                    <strong>{reply.authorName}</strong>
                    <time className={styles.articleDate} dateTime={reply.createdAt}>
                      Posted {formatBlogDate(reply.createdAt)}
                    </time>
                  </div>
                  <p className={styles.replyBody}>{reply.body}</p>
                  <div className={styles.formActions}>
                    <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setReplyTarget(reply)} type="button">
                      Reply
                    </button>
                  </div>
                </div>

                {childReplies.length > 0 ? (
                  <div className={styles.replyChildren}>
                    {childReplies.map((childReply) => (
                      <article className={`${styles.replyCard} ${styles.replyCardNested}`} key={childReply.id}>
                        <div className={styles.articleMeta}>
                          <strong>{childReply.authorName}</strong>
                          <time className={styles.articleDate} dateTime={childReply.createdAt}>
                            Posted {formatBlogDate(childReply.createdAt)}
                          </time>
                        </div>
                        <p className={styles.replyBody}>{childReply.body}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
