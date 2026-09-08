import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
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
  optimizedImage?: string;
  imageHeight: number;
  imageWidth: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
};

export default function ProjectItem(props: ProjectItemProps) {
  const baseId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const titleId = `${baseId}-title`;
  const techId = `${baseId}-tech`;
  const descriptionId = `${baseId}-description`;

  useEffect(() => {
    if (!props.isExpanded) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const appRoot = document.getElementById("root");
    const previousOverflow = document.body.style.overflow;
    const rootWasInert = appRoot?.inert ?? false;
    const previousAriaHidden = appRoot?.getAttribute("aria-hidden") ?? null;

    document.body.style.overflow = "hidden";

    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute("aria-hidden", "true");
    }

    const getFocusableElements = () => {
      const dialog = dialogRef.current;

      if (!dialog) {
        return [];
      }

      return Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    };

    const focusTimer = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableElements();
      (focusableElements[0] ?? dialogRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (event.repeat) {
          return;
        }

        event.preventDefault();
        props.onToggle(props.id);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (appRoot) {
        appRoot.inert = rootWasInert;

        if (previousAriaHidden === null) {
          appRoot.removeAttribute("aria-hidden");
        } else {
          appRoot.setAttribute("aria-hidden", previousAriaHidden);
        }
      }

      previouslyFocused?.focus();
    };
  }, [props.id, props.isExpanded, props.onToggle]);

  return (
    <>
      <motion.article
        className={styles.projectContainer}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }}
        viewport={{ amount: 0.25, once: true }}
      >
        <button
          type="button"
          className={styles.summaryButton}
          aria-expanded={props.isExpanded}
          aria-labelledby={titleId}
          aria-describedby={props.techStack.length > 0 ? techId : undefined}
          onClick={() => props.onToggle(props.id)}
        >
          <span className={styles.summaryMedia}>
            <picture className={styles.imagePicture}>
              {props.optimizedImage ? <source srcSet={props.optimizedImage} type="image/avif" /> : null}
              <img
                alt=""
                className={styles.image}
                decoding="async"
                height={props.imageHeight}
                loading="lazy"
                src={props.image}
                width={props.imageWidth}
              />
            </picture>
            <span className={styles.overlay}>
              <span className={styles.overlayHeader}>
                <span id={titleId} className={styles.title} role="heading" aria-level={3}>
                  {props.title}
                </span>
                <span className={styles.toggleText} aria-hidden="true">
                  Expand
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
          </span>
        </button>
      </motion.article>

      {createPortal(
        <AnimatePresence>
          {props.isExpanded && (
            <div className={styles.modalBackdrop} style={{ zIndex: 9999 }}>
              <motion.div
                className={styles.modalOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => props.onToggle(props.id)}
              />
              <motion.div
                className={styles.modalContent}
                aria-describedby={descriptionId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${titleId}-modal`}
                ref={dialogRef}
                tabIndex={-1}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <button
                  className={styles.closeButton}
                  onClick={() => props.onToggle(props.id)}
                  aria-label="Close project details"
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div className={styles.modalMedia}>
                  <picture className={styles.imagePicture}>
                    {props.optimizedImage ? <source srcSet={props.optimizedImage} type="image/avif" /> : null}
                    <img
                      alt=""
                      className={styles.modalImage}
                      decoding="async"
                      height={props.imageHeight}
                      src={props.image}
                      width={props.imageWidth}
                    />
                  </picture>
                  <div className={styles.modalOverlayHeader}>
                    <h3 id={`${titleId}-modal`} className={styles.modalTitle}>
                      {props.title}
                    </h3>
                    {props.techStack.length > 0 && (
                      <div className={styles.techStackList}>
                        {props.techStack.map((tech, index) => (
                          <span key={`${tech}-${index}`} className={styles.techStackItem}>
                            {props.icons?.[index] && (
                              <span className={styles.icon}>{props.icons[index]}</span>
                            )}
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.modalDetails}>
                  <p className={styles.description} id={descriptionId}>{props.description}</p>
                  <div className={styles.linksContainer}>
                    {props.links?.github && (
                      <motion.a
                        href={props.links.github}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.iconContainer}
                        aria-label={`View ${props.title} source code on GitHub`}
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
                        aria-label={`Visit the ${props.title} website`}
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
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
