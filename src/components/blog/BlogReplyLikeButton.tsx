import { useEffect, useState } from "react";
import {
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

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setHasLiked(hasLikedBlogReply(replyId));
    setIsSaving(false);
  }, [initialLikeCount, replyId]);

  const label = isSaving ? (hasLiked ? "Updating..." : "Liking...") : hasLiked ? "Liked" : "Like";

  async function handleLike(): Promise<void> {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

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
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      aria-label={`${label} ${title}, ${formatLikeCount(likeCount)}`}
      aria-pressed={hasLiked}
      className={[styles.likeButton, styles.likeButtonCompact, hasLiked ? styles.likeButtonLiked : ""]
        .filter(Boolean)
        .join(" ")}
      disabled={isSaving}
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
  );
}
