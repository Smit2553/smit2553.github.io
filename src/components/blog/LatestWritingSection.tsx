import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchBlogPosts,
  getBlogErrorMessage,
  type BlogListItem,
} from "../../lib/blog";
import BlogPreviewCard from "./BlogPreviewCard";
import styles from "./blog.module.css";

type WritingState =
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

export default function LatestWritingSection() {
  const [state, setState] = useState<WritingState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const posts = await fetchBlogPosts(3);

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
    <section className={styles.section}>
      <div className={styles.sectionInner}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Writing</p>
          <h1 className={styles.sectionTitle} id="writing">
            Latest Writing
          </h1>
          <p className={styles.sectionLead}>
            Short essays, technical notes, and whatever I am thinking through
            next.
          </p>
        </div>

        {state.status === "loading" && (
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>Loading latest writing...</h2>
            <p className={styles.statusText}>
              Fetching the newest posts from the backend.
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>Writing is unavailable.</h2>
            <p className={styles.statusText}>{state.message}</p>
          </div>
        )}

        {state.status === "ready" && state.posts.length === 0 && (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>No published posts yet.</h2>
            <p className={styles.emptyText}>
              The blog is ready, but there is nothing public to show right now.
            </p>
          </div>
        )}

        {state.status === "ready" && state.posts.length > 0 && (
          <div className={styles.cardGrid}>
            {state.posts.map((post) => (
              <BlogPreviewCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        <div className={styles.sectionActions}>
          <Link className={styles.buttonLink} to="/blog">
            View all writing
          </Link>
        </div>
      </div>
    </section>
  );
}
