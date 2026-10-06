import { useEffect, useState } from "react";
import {
  getBlogErrorMessage,
  hasLikedBlogReply,
  likeBlogReply,
  markBlogReplyLiked,
  unmarkBlogReplyLiked,
} from "../../lib/blog";
import styles from "./blog.module.css";

type BlogReplyLikeButtonProps = {
  slug: string;
  replyId: string;
  initialLikeCount: number;
  title: string;
};

function formatLikeCount(count: number): string {
  return `${count} ${count === 1 ? "like" : "likes"}`;
}

export default function BlogReplyLikeButton({ initialLikeCount, replyId, slug, title }: BlogReplyLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(() => hasLikedBlogReply(replyId));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  useEffect(() => {
    setHasLiked(hasLikedBlogReply(replyId));
    setIsSaving(false);
    setErrorMessage(null);
  }, [replyId]);

  const label = isSaving ? (hasLiked ? "Updating..." : "Liking...") : hasLiked ? "Liked" : "Like";

  async function handleLike(): Promise<void> {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await likeBlogReply(slug, replyId);

      if (result.liked) {
        markBlogReplyLiked(replyId);
      } else {
        unmarkBlogReplyLiked(replyId);
      }

      setLikeCount(result.likeCount);
      setHasLiked(result.liked);
    } catch (error) {
      setErrorMessage(getBlogErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        aria-label={`${label} ${title}, ${formatLikeCount(likeCount)}`}
        aria-pressed={hasLiked}
        className={[styles.likeButton, styles.likeButtonCompact, hasLiked ? styles.likeButtonLiked : ""]
          .filter(Boolean)
          .join(" ")}
        disabled={isSaving}
        title={errorMessage ?? undefined}
        type="button"
        onClick={() => {
          void handleLike();
        }}
      >
        <span>{label}</span>
        <span aria-live="polite" className={styles.likeButtonCount}>
          {formatLikeCount(likeCount)}
        </span>
      </button>
      {errorMessage ? (
        <span className={styles.likeError} role="alert">
          {errorMessage}
        </span>
      ) : null}
    </>
  );
}
