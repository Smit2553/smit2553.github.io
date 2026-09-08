import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlogPreviewCard from "../components/blog/BlogPreviewCard";
import styles from "../components/blog/blog.module.css";
import {
  fetchBlogPosts,
  getBlogErrorMessage,
  type BlogListItem,
} from "../lib/blog";

type BlogIndexState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      posts: BlogListItem[];
    }
  | {
      status: "error";
      message: string;
    };

export default function BlogIndexPage() {
  const [state, setState] = useState<BlogIndexState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const posts = await fetchBlogPosts();

        if (active) {
          setState({ status: "ready", posts });
        }
      } catch (error) {
        if (active) {
          setState({ status: "error", message: getBlogErrorMessage(error) });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Blog</p>
          <h1 className={styles.pageTitle}>Writing</h1>
          <p className={styles.pageLead}>
            Public essays, project notes, and technical writeups from the blog.
          </p>
          <div className={styles.pageActions}>
            <Link className={styles.buttonLink} to="/">
              Back home
            </Link>
          </div>
        </header>

        {state.status === "loading" && (
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>Loading posts...</h2>
            <p className={styles.statusText}>
              Fetching the latest published writing from the backend.
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>Unable to load the blog.</h2>
            <p className={styles.statusText}>{state.message}</p>
            <div className={styles.statusActions}>
              <Link className={styles.buttonLink} to="/">
                Back home
              </Link>
            </div>
          </div>
        )}

        {state.status === "ready" && state.posts.length === 0 && (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No published posts yet.</h2>
            <p className={styles.emptyText}>
              The public blog is wired up, but there are no articles to show.
            </p>
            <div className={styles.emptyActions}>
              <Link className={styles.buttonLink} to="/">
                Back home
              </Link>
            </div>
          </div>
        )}

        {state.status === "ready" && state.posts.length > 0 && (
          <div className={styles.cardGridList}>
            {state.posts.map((post) => (
              <BlogPreviewCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
