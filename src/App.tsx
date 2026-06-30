import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import styles from "./App.module.css";

const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminPostFormPage = lazy(() => import("./pages/admin/AdminPostFormPage"));
const AdminPostsPage = lazy(() => import("./pages/admin/AdminPostsPage"));
const AdminRepliesPage = lazy(() => import("./pages/admin/AdminRepliesPage"));

export default function App() {
  return (
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
  );
}
