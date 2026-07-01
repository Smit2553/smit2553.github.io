import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import styles from "./App.module.css";
import { fetchSiteConfig, type SiteConfig } from "./lib/site";

const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminPostFormPage = lazy(() => import("./pages/admin/AdminPostFormPage"));
const AdminPostsPage = lazy(() => import("./pages/admin/AdminPostsPage"));
const AdminRepliesPage = lazy(() => import("./pages/admin/AdminRepliesPage"));

export default function App() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchSiteConfig()
      .then((config) => {
        if (!cancelled) {
          setSiteConfig(config);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSiteConfig({
            developmentWebsite: false,
            productionWebsiteUrl: "https://smit.codestacx.com",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {siteConfig?.developmentWebsite ? (
        <div className={styles.environmentBanner} role="status">
          <p className={styles.environmentBannerText}>
            This is the development website. The real website is at{" "}
            <a className={styles.environmentBannerLink} href={siteConfig.productionWebsiteUrl}>
              {siteConfig.productionWebsiteUrl}
            </a>
            .
          </p>
        </div>
      ) : null}
      <Suspense
        fallback={(
          <main className={styles.routeFallback} aria-busy="true" aria-live="polite">
            <p className={styles.routeFallbackText}>Loading page...</p>
          </main>
        )}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/admin" element={<Navigate to="/admin/posts" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/posts" element={<AdminPostsPage />} />
          <Route path="/admin/posts/new" element={<AdminPostFormPage />} />
          <Route path="/admin/posts/:id/edit" element={<AdminPostFormPage />} />
          <Route path="/admin/replies" element={<AdminRepliesPage />} />
          <Route path="/admin/*" element={<Navigate to="/admin/posts" replace />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </>
  );
}
