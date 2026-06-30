import type { ReactNode } from "react";
import styles from "./admin.module.css";

type AdminShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  lead?: ReactNode;
  title: string;
};

export default function AdminShell({ actions, children, eyebrow = "Admin", lead, title }: AdminShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            {lead ? <p className={styles.lead}>{lead}</p> : null}
          </div>

          {actions ? <div className={styles.toolbar}>{actions}</div> : null}
        </header>

        {children}
      </div>
    </main>
  );
}
