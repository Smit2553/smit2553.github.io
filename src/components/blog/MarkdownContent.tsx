import rehypeSanitize from "rehype-sanitize";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./blog.module.css";

const components: Components = {
  a: ({ href, children, ...props }) => {
    const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);

    return (
      <a
        {...props}
        href={href}
        rel={isExternal ? "noreferrer" : undefined}
        target={isExternal ? "_blank" : undefined}
      >
        {children}
      </a>
    );
  },
  img: ({ alt, src, ...props }) => (
    <img
      {...props}
      alt={alt ?? ""}
      decoding="async"
      loading="lazy"
      src={src ?? ""}
    />
  ),
  table: ({ children }) => (
    <div className={styles.tableWrap}>
      <table>{children}</table>
    </div>
  ),
};

type MarkdownContentProps = {
  content: string;
};

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
