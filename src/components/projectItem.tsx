import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useId } from "react";
import styles from "./projectItem.module.css";

type ProjectItemProps = {
  id: string;
  title: string;
  description: string;
  links?: {
    github?: string;
    live?: string;
  };
  icons?: ReactNode[];
  techStack: string[];
  image: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
};

export default function ProjectItem(props: ProjectItemProps) {
  const baseId = useId();
  const shouldReduceMotion = useReducedMotion();
  const titleId = `${baseId}-title`;
  const panelId = `${baseId}-panel`;
  const techId = `${baseId}-tech`;

  return (
    <motion.article
      layout={!shouldReduceMotion}
      className={`${styles.projectContainer} ${props.isExpanded ? styles.projectContainerExpanded : ""}`}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }}
      transition={{ layout: { duration: shouldReduceMotion ? 0 : 0.35, ease: "easeInOut" } }}
      viewport={{ amount: 0.25, once: true }}
    >
      <button
        type="button"
        className={styles.summaryButton}
        aria-expanded={props.isExpanded}
        aria-controls={panelId}
        aria-labelledby={titleId}
        aria-describedby={props.techStack.length > 0 ? techId : undefined}
        onClick={() => props.onToggle(props.id)}
      >
        <motion.span
          layout={!shouldReduceMotion}
          className={`${styles.summaryMedia} ${props.isExpanded ? styles.summaryMediaExpanded : ""}`}
          transition={{ layout: { duration: shouldReduceMotion ? 0 : 0.35, ease: "easeInOut" } }}
        >
          <img
            src={props.image}
            alt=""
            className={`${styles.image} ${props.isExpanded ? styles.imageExpanded : ""}`}
          />
          <span className={`${styles.overlay} ${props.isExpanded ? styles.overlayExpanded : ""}`}>
            <span className={styles.overlayHeader}>
              <span id={titleId} className={styles.title} role="heading" aria-level={3}>
                {props.title}
              </span>
              <span className={styles.toggleText} aria-hidden="true">
                {props.isExpanded ? "Collapse" : "Expand"}
              </span>
            </span>
            {props.techStack.length > 0 && (
              <span id={techId} className={styles.techStackList}>
                {props.techStack.map((tech, index) => (
                  <span key={`${tech}-${index}`} className={styles.techStackItem}>
                    {props.icons?.[index] && (
                      <span className={styles.icon}>{props.icons[index]}</span>
                    )}
                    {tech}
                  </span>
                ))}
              </span>
            )}
          </span>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {props.isExpanded ? (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={titleId}
            className={styles.details}
            initial={shouldReduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeInOut" }}
          >
            <motion.div
              className={styles.detailsInner}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, delay: shouldReduceMotion ? 0 : 0.08, ease: "easeOut" }}
            >
              <motion.p className={styles.description}>{props.description}</motion.p>
              <motion.div className={styles.linksContainer}>
                {props.links?.github && (
                  <motion.a
                    href={props.links.github}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.iconContainer}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <img
                      src="/icons/logo-github.svg"
                      alt="Github"
                      width={30}
                      height={30}
                      className={styles.linkIcon}
                    />
                  </motion.a>
                )}
                {props.links?.live && (
                  <motion.a
                    href={props.links.live}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.iconContainer}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <img
                      src="/icons/logo-web.svg"
                      alt="Live Website"
                      width={30}
                      height={30}
                      className={styles.linkIcon}
                    />
                  </motion.a>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
