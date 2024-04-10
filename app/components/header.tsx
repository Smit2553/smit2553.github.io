import styles from "./header.module.css";

export default function Header(props: { backlink: string }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.name}>Smit Devrukhkar</h1>
        <div className={styles.linksContainer}>
          <a href="/" className={styles.link}>
            Home
          </a>
          <a href="/projects" className={styles.link}>
            Projects
          </a>
          <a href="/resume" className={styles.link}>
            Resume
          </a>
        </div>
      </div>
    </div>
  );
}
