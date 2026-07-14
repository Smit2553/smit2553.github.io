import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PageMetadata, { MetadataProvider } from "./components/PageMetadata";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import styles from "./App.module.css";
import { fetchSiteConfig, type SiteConfig } from "./lib/site";

const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminPostFormPage = lazy(() => import("./pages/admin/AdminPostFormPage"));
const AdminPostsPage = lazy(() => import("./pages/admin/AdminPostsPage"));
const AdminRepliesPage = lazy(() => import("./pages/admin/AdminRepliesPage"));

function RouteMetadata() {
  const { pathname } = useLocation();

  if (/^\/blog\/[^/]+\/?$/.test(pathname)) {
    return null;
  }

  if (pathname === "/") {
    return (
      <PageMetadata
        canonicalPath="/"
        description="Portfolio of Smit Devrukhkar, a computer science researcher and software engineer at Arizona State University."
        title="Smit Devrukhkar | Researcher & Software Engineer"
      />
    );
  }

  if (pathname === "/blog" || pathname === "/blog/") {
    return (
      <PageMetadata
        canonicalPath="/blog"
        description="Essays, project notes, and technical writing from Smit Devrukhkar."
        title="Writing | Smit Devrukhkar"
      />
    );
  }

  if (pathname.startsWith("/admin")) {
    let title = "Blog Admin | Smit Devrukhkar";

    if (pathname === "/admin/login") {
      title = "Admin Sign In | Smit Devrukhkar";
    } else if (pathname === "/admin/posts/new") {
      title = "New Blog Post | Smit Devrukhkar";
    } else if (/^\/admin\/posts\/[^/]+\/edit\/?$/.test(pathname)) {
      title = "Edit Blog Post | Smit Devrukhkar";
    } else if (pathname.startsWith("/admin/replies")) {
      title = "Moderate Replies | Smit Devrukhkar";
    } else if (pathname.startsWith("/admin/posts")) {
      title = "Manage Blog Posts | Smit Devrukhkar";
    }

    return (
      <PageMetadata
        canonicalPath={pathname}
        description="Private blog administration for Smit Devrukhkar."
        noIndex
        title={title}
      />
    );
  }

  return (
    <PageMetadata
      canonicalPath={pathname}
      description="The requested page could not be found."
      noIndex
      title="Page Not Found | Smit Devrukhkar"
    />
  );
}

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
    <MetadataProvider baseUrl={siteConfig?.productionWebsiteUrl}>
      <RouteMetadata />
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </MetadataProvider>
  );
}
