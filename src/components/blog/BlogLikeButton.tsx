import { useEffect, useState } from "react";
import {
  hasLikedBlogPost,
  likeBlogPostById,
  markBlogPostLiked,
  unmarkBlogPostLiked,
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

  const label = isSaving ? (hasLiked ? "Updating..." : "Liking...") : hasLiked ? "Liked" : "Like";

  async function handleLike(): Promise<void> {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await likeBlogPostById(postId);

      if (result.liked) {
        markBlogPostLiked(postId);
      } else {
        unmarkBlogPostLiked(postId);
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
      className={[
        styles.likeButton,
        compact ? styles.likeButtonCompact : "",
        hasLiked ? styles.likeButtonLiked : "",
      ]
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
