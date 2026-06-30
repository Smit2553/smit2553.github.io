import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MarkdownContent from "../components/blog/MarkdownContent";
import styles from "../components/blog/blog.module.css";
import {
  fetchBlogPost,
  formatBlogDate,
  getBlogErrorMessage,
  type BlogPost,
} from "../lib/blog";

type BlogPostState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      post: BlogPost;
    }
  | {
      status: "notFound";
    }
  | {
      status: "error";
      message: string;
    };

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<BlogPostState>({ status: "loading" });

  useEffect(() => {
    if (!slug || slug.trim().length === 0) {
      setState({ status: "notFound" });
      return;
    }

    let active = true;
    setState({ status: "loading" });

    void (async () => {
      try {
        const post = await fetchBlogPost(slug);

        if (!active) {
          return;
        }

        if (!post) {
          setState({ status: "notFound" });
          return;
        }

        setState({ status: "ready", post });
      } catch (error) {
        if (active) {
          setState({ status: "error", message: getBlogErrorMessage(error) });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <div className={styles.articleShell}>
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>Loading post...</h2>
            <p className={styles.statusText}>
              Fetching the article content from the backend.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (state.status === "notFound") {
    return (
      <main className={styles.page}>
        <div className={styles.articleShell}>
          <div className={styles.emptyState}>
            <p className={styles.eyebrow}>Blog</p>
            <h1 className={styles.emptyTitle}>Post not found.</h1>
            <p className={styles.emptyText}>
              The requested article does not exist or is not public yet.
            </p>
            <div className={styles.emptyActions}>
              <Link className={styles.buttonLink} to="/blog">
                Back to writing
              </Link>
              <Link className={styles.buttonLink} to="/">
                Back home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className={styles.page}>
        <div className={styles.articleShell}>
          <div className={styles.statusCard}>
            <p className={styles.eyebrow}>Blog</p>
            <h1 className={styles.statusTitle}>Unable to load the post.</h1>
            <p className={styles.statusText}>{state.message}</p>
            <div className={styles.statusActions}>
              <Link className={styles.buttonLink} to="/blog">
                Back to writing
              </Link>
              <Link className={styles.buttonLink} to="/">
                Back home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { post } = state;

  return (
    <main className={styles.page}>
      <article className={styles.articleShell}>
        <header className={styles.articleHeader}>
          <p className={styles.eyebrow}>Blog</p>
          <h1 className={styles.articleTitle}>{post.title}</h1>
          <div className={styles.articleMeta}>
            <time className={styles.articleDate} dateTime={post.publishedAt}>
              Published {formatBlogDate(post.publishedAt)}
            </time>
            {post.updatedAt !== post.publishedAt && (
              <span>Updated {formatBlogDate(post.updatedAt)}</span>
            )}
          </div>
          {post.summary && <p className={styles.articleSummary}>{post.summary}</p>}
          <div className={styles.pageActions}>
            <Link className={styles.buttonLink} to="/blog">
              Back to writing
            </Link>
            <Link className={styles.buttonLink} to="/">
              Back home
            </Link>
          </div>
        </header>

        <div className={styles.articleContent}>
          <MarkdownContent content={post.content} />
        </div>
      </article>
    </main>
  );
}
