import { useEffect, useState } from "react";
import {
  hasLikedBlogPost,
  likeBlogPostById,
  markBlogPostLiked,
} from "../../lib/blog";
import styles from "./blog.module.css";

type BlogLikeButtonProps = {
  postId: string;
  initialLikeCount: number;
  compact?: boolean;
  title: string;
};

function formatLikeCount(count: number): string {
  return `${count} ${count === 1 ? "like" : "likes"}`;
}

export default function BlogLikeButton({
  compact = false,
  initialLikeCount,
  postId,
  title,
}: BlogLikeButtonProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(() => hasLikedBlogPost(postId));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLikeCount(initialLikeCount);
    setHasLiked(hasLikedBlogPost(postId));
    setIsSaving(false);
  }, [initialLikeCount, postId]);

  const label = isSaving ? "Liking..." : hasLiked ? "Liked" : "Like";

  async function handleLike(): Promise<void> {
    if (hasLiked || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await likeBlogPostById(postId);

      markBlogPostLiked(postId);
      setLikeCount(result.likeCount);
      setHasLiked(true);
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
      className={[
        styles.likeButton,
        compact ? styles.likeButtonCompact : "",
        hasLiked ? styles.likeButtonLiked : "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={hasLiked || isSaving}
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
