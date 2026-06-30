import { Link } from "react-router-dom";
import type { BlogListItem } from "../../lib/blog";
import { formatBlogDate } from "../../lib/blog";
import styles from "./blog.module.css";

type BlogPreviewCardProps = {
  post: BlogListItem;
};

export default function BlogPreviewCard({ post }: BlogPreviewCardProps) {
  return (
    <Link
      aria-label={`Read ${post.title}`}
      className={styles.postCard}
      to={`/blog/${encodeURIComponent(post.slug)}`}
    >
      <div className={styles.postCardMeta}>
        <time className={styles.postCardDate} dateTime={post.publishedAt}>
          Published {formatBlogDate(post.publishedAt)}
        </time>
        {post.updatedAt !== post.publishedAt && (
          <span>Updated {formatBlogDate(post.updatedAt)}</span>
        )}
      </div>

      <h3 className={styles.postCardTitle}>{post.title}</h3>
      <p className={styles.postCardExcerpt}>{post.excerpt}</p>

      <div className={styles.postCardFooter}>
        <span>Read article</span>
        <span className={styles.postCardArrow}>-&gt;</span>
      </div>
    </Link>
  );
}
