import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import AdminShell from "./AdminShell";
import styles from "./admin.module.css";
import {
  AdminApiError,
  type AdminPost,
  createAdminPost,
  deleteAdminPost,
  fetchAdminHealth,
  fetchAdminPost,
  getAdminErrorMessage,
  updateAdminPost,
  type AdminPostStatus,
} from "../../lib/admin";

type FormValues = {
  content: string;
  coverImageUrl: string;
  slug: string;
  status: AdminPostStatus;
  summary: string;
  title: string;
};

type LoadState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
    }
  | {
      status: "notFound";
    }
  | {
      status: "error";
      message: string;
    };

function createEmptyForm(): FormValues {
  return {
    content: "",
    coverImageUrl: "",
    slug: "",
    status: "draft",
    summary: "",
    title: "",
  };
}

function toFormValues(post: AdminPost): FormValues {
  return {
    content: post.content,
    coverImageUrl: post.coverImageUrl ?? "",
    slug: post.slug,
    status: post.status,
    summary: post.summary ?? "",
    title: post.title,
  };
}

function isFormValues(value: unknown): value is FormValues {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const form = value as Partial<Record<keyof FormValues, unknown>>;

  return (
    typeof form.content === "string"
    && typeof form.coverImageUrl === "string"
    && typeof form.slug === "string"
    && (form.status === "draft" || form.status === "published")
    && typeof form.summary === "string"
    && typeof form.title === "string"
  );
}

function readPersistedForm(storageKey: string): FormValues | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey);

    if (raw === null) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    return isFormValues(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writePersistedForm(storageKey: string, form: FormValues): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(form));
  } catch {
    // Ignore storage failures so the editor still works without persistence.
  }
}

function clearPersistedForm(storageKey: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Ignore storage failures so save/delete still complete.
  }
}

export default function AdminPostFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = typeof id === "string" && id.length > 0;
  const navigate = useNavigate();
  const location = useLocation();
  const draftStorageKey = `admin-post-editor:${location.pathname}`;
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [form, setForm] = useState<FormValues>(() => createEmptyForm());
  const [savedPost, setSavedPost] = useState<AdminPost | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const shouldPersistDraftRef = useRef(false);

  useEffect(() => {
    let active = true;
    const persistedForm = readPersistedForm(draftStorageKey);

    shouldPersistDraftRef.current = false;
    setNotice(null);
    setSavedPost(null);
    setState({ status: "loading" });
    setForm(persistedForm ?? createEmptyForm());

    if (!isEditing || !id) {
      void (async () => {
        try {
          await fetchAdminHealth();

          if (active) {
            setState({ status: "ready" });
          }
        } catch (error) {
          if (!active) {
            return;
          }

          if (error instanceof AdminApiError && error.status === 401) {
            navigate("/admin/login", {
              replace: true,
              state: { from: location.pathname },
            });
            return;
          }

          setState({ status: "error", message: getAdminErrorMessage(error) });
        }
      })();

      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const post = await fetchAdminPost(id);

        if (!active) {
          return;
        }

        if (persistedForm === null) {
          setForm(toFormValues(post));
        }

        setSavedPost(post);
        setState({ status: "ready" });
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof AdminApiError && error.status === 401) {
          navigate("/admin/login", {
            replace: true,
            state: { from: location.pathname },
          });
          return;
        }

        if (error instanceof AdminApiError && error.status === 404) {
          setState({ status: "notFound" });
          return;
        }

        setState({ status: "error", message: getAdminErrorMessage(error) });
      }
    })();

    return () => {
      active = false;
    };
  }, [id, isEditing, location.pathname, navigate, reloadToken]);

  useEffect(() => {
    if (!shouldPersistDraftRef.current) {
      return;
    }

    writePersistedForm(draftStorageKey, form);
  }, [draftStorageKey, form]);

  const updateForm = (next: Partial<FormValues>) => {
    shouldPersistDraftRef.current = true;
    setForm((current) => ({ ...current, ...next }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const slug = form.slug.trim();
    const title = form.title.trim();
    const summary = form.summary.trim();
    const coverImageUrl = form.coverImageUrl.trim();

    if (slug.length === 0 || title.length === 0 || form.content.trim().length === 0) {
      setNotice("Slug, title, and content are required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        content: form.content,
        coverImageUrl: coverImageUrl.length > 0 ? coverImageUrl : null,
        slug,
        status: form.status,
        summary: summary.length > 0 ? summary : null,
        title,
      };

      if (isEditing && id) {
        await updateAdminPost(id, payload);
      } else {
        await createAdminPost(payload);
      }

      clearPersistedForm(draftStorageKey);
      shouldPersistDraftRef.current = false;

      navigate("/admin/posts", {
        replace: true,
        state: {
          notice: isEditing ? "Post updated." : "Post created.",
        },
      });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        navigate("/admin/login", {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }

      setNotice(getAdminErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !id) {
      return;
    }

    if (!window.confirm(`Delete "${form.title.trim() || "this post"}"? This cannot be undone.`)) {
      return;
    }

    setNotice(null);
    setIsDeleting(true);

    try {
      await deleteAdminPost(id);
      clearPersistedForm(draftStorageKey);
      shouldPersistDraftRef.current = false;
      navigate("/admin/posts", {
        replace: true,
        state: {
          notice: `Deleted "${form.title.trim() || "this post"}".`,
        },
      });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        navigate("/admin/login", {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }

      setNotice(getAdminErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const actions = (
    <>
      <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/admin/posts">
        Back to posts
      </Link>
      <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/admin/replies">
        Replies
      </Link>
      <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/">
        View site
      </Link>
      {isEditing && savedPost?.status === "published" && savedPost.slug.trim().length > 0 ? (
        <Link
          className={styles.button}
          rel="noreferrer"
          target="_blank"
          to={`/blog/${encodeURIComponent(savedPost.slug.trim())}`}
        >
          Open public
        </Link>
      ) : null}
    </>
  );

  return (
    <AdminShell
      actions={actions}
      lead={isEditing ? "Update the slug, metadata, status, or markdown content." : "Create a draft or publish a new article."}
      title={isEditing ? "Edit post" : "New post"}
    >
      <div className={styles.stack}>
        {state.status === "loading" ? (
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>{isEditing ? "Loading post..." : "Checking access..."}</h2>
            <p className={styles.sectionText}>{isEditing ? "Fetching the post from the backend." : "Verifying the admin session."}</p>
          </section>
        ) : null}

        {state.status === "error" ? (
          <section className={styles.panel}>
            <h2 className={styles.sectionTitle}>{isEditing ? "Unable to load the post." : "Unable to load the editor."}</h2>
            <p className={styles.sectionText}>{state.message}</p>
            <div className={styles.formActions}>
              <button className={styles.button} onClick={() => setReloadToken((value) => value + 1)} type="button">
                Retry
              </button>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/admin/posts">
                Back to posts
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === "notFound" ? (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Post not found.</h2>
            <p className={styles.emptyText}>The post you requested does not exist or is not available.</p>
            <div className={styles.formActions}>
              <Link className={styles.button} to="/admin/posts">
                Back to posts
              </Link>
            </div>
          </section>
        ) : null}

        {state.status === "ready" ? (
          <section className={`${styles.panel} ${styles.formPanel}`}>
            <form className={styles.form} onSubmit={handleSubmit}>
              {notice ? (
                <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
                  {notice}
                </div>
              ) : null}

              <div className={styles.fieldGrid}>
                <label className={styles.field} htmlFor="post-slug">
                  <span className={styles.label}>Slug</span>
                  <input
                    autoComplete="off"
                    className={styles.input}
                    id="post-slug"
                    maxLength={120}
                    name="slug"
                    onChange={(event) => updateForm({ slug: event.target.value })}
                    placeholder="my-post-slug"
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    spellCheck={false}
                    type="text"
                    value={form.slug}
                  />
                  <span className={styles.helper}>This becomes the public URL at `/blog/{form.slug.trim() || "your-slug"}`.</span>
                </label>

                <label className={styles.field} htmlFor="post-status">
                  <span className={styles.label}>Status</span>
                  <select
                    className={styles.select}
                    id="post-status"
                    name="status"
                    onChange={(event) => updateForm({ status: event.target.value === "published" ? "published" : "draft" })}
                    value={form.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <span className={styles.helper}>Drafts stay private. Published posts appear on the public blog.</span>
                </label>
              </div>

              <label className={styles.field} htmlFor="post-title">
                <span className={styles.label}>Title</span>
                <input
                  className={styles.input}
                  id="post-title"
                  maxLength={200}
                  name="title"
                  onChange={(event) => updateForm({ title: event.target.value })}
                  placeholder="Working title"
                  type="text"
                  value={form.title}
                />
              </label>

              <label className={styles.field} htmlFor="post-summary">
                <span className={styles.label}>Summary</span>
                <textarea
                  className={styles.textarea}
                  id="post-summary"
                  maxLength={500}
                  name="summary"
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  placeholder="Short summary for cards and previews"
                  rows={4}
                  value={form.summary}
                />
                <span className={styles.helper}>Shown in the admin list and the public preview card.</span>
              </label>

              <label className={styles.field} htmlFor="post-cover-image-url">
                <span className={styles.label}>Cover image URL</span>
                <input
                  className={styles.input}
                  id="post-cover-image-url"
                  maxLength={2048}
                  name="coverImageUrl"
                  onChange={(event) => updateForm({ coverImageUrl: event.target.value })}
                  placeholder="https://example.com/cover-image.jpg"
                  spellCheck={false}
                  type="url"
                  value={form.coverImageUrl}
                />
                <span className={styles.helper}>Optional. Shown above the article and on public preview cards.</span>
              </label>

              <label className={styles.field} htmlFor="post-content">
                <span className={styles.label}>Markdown content</span>
                <textarea
                  className={styles.textarea}
                  id="post-content"
                  maxLength={30000}
                  name="content"
                  onChange={(event) => updateForm({ content: event.target.value })}
                  placeholder="Write the article in markdown..."
                  rows={18}
                  value={form.content}
                />
                <span className={styles.helper}>Headings, lists, links, code fences, and markdown image syntax are supported.</span>
              </label>

              <div className={styles.formActions}>
                <button className={styles.button} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : "Save post"}
                </button>

                {isEditing ? (
                  <button
                    className={`${styles.button} ${styles.buttonDanger}`}
                    disabled={isDeleting || isSaving}
                    onClick={() => void handleDelete()}
                    type="button"
                  >
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </button>
                ) : null}

                <Link className={`${styles.button} ${styles.buttonSecondary}`} to="/admin/posts">
                  Cancel
                </Link>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
