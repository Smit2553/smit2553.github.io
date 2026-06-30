import { Navigate, Route, Routes } from "react-router-dom";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminPostFormPage from "./pages/admin/AdminPostFormPage";
import AdminPostsPage from "./pages/admin/AdminPostsPage";
import AdminRepliesPage from "./pages/admin/AdminRepliesPage";
import BlogIndexPage from "./pages/BlogIndexPage";
import BlogPostPage from "./pages/BlogPostPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
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
  );
}
