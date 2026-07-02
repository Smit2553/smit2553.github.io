import { Link } from "react-router-dom";
import BlogLikeButton from "./BlogLikeButton";
import type { BlogListItem } from "../../lib/blog";
import { formatBlogDate } from "../../lib/blog";
import styles from "./blog.module.css";

type BlogPreviewCardProps = {
  post: BlogListItem;
};

export default function BlogPreviewCard({ post }: BlogPreviewCardProps) {
  return (
    <article className={styles.postCard}>
      <Link
        aria-label={`Read ${post.title}`}
        className={styles.postCardBodyLink}
        to={`/blog/${encodeURIComponent(post.slug)}`}
      >
        {post.coverImageUrl ? (
          <div className={styles.postCardCoverWrap}>
            <img alt="" className={styles.postCardCover} loading="lazy" src={post.coverImageUrl} />
          </div>
        ) : null}

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
      </Link>

      <div className={styles.postCardFooter}>
        <BlogLikeButton
          compact
          initialLikeCount={post.likeCount}
          postId={post.id}
          title={post.title}
        />
        <Link className={styles.postCardReadLink} to={`/blog/${encodeURIComponent(post.slug)}`}>
          Read article <span className={styles.postCardArrow}>-&gt;</span>
        </Link>
      </div>
    </article>
  );
}
