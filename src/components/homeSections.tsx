import { motion, useInView, useReducedMotion } from "framer-motion";
import { FaGraduationCap } from "react-icons/fa";
import { useRef } from "react";
import styles from "./homeSections.module.css";

type ExperienceEntry = {
  title: string;
  company: string;
  duration: string;
  description: string;
  logoUrl: string;
};

const experienceEntries: ExperienceEntry[] = [
  {
    title: "Undergraduate Researcher",
    company: "VISA Research Lab, Arizona State University",
    duration: "December 2025 - Present",
    description:
      "Conducting research in collaboration with VISA Research Lab on cutting-edge SSD storage technology.",
    logoUrl: "/logos/visa_research_lab_logo.jpg",
  },
  {
    title: "Software Engineering Intern",
    company: "Defined Bioscience",
    duration: "September 2025 - Present",
    description: "Software engineering intern working on biotechnology solutions.",
    logoUrl: "/logos/defined_bioscience_logo.jpg",
  },
  {
    title: "Undergraduate Teaching Assistant - Operating Systems (Linux kernel, Ubuntu)",
    company: "School of Computing and Augmented Intelligence, Arizona State University",
    duration: "August 2025 - December 2025",
    description: "Teaching assistant for operating systems course focusing on Linux kernel and Ubuntu.",
    logoUrl: "/logos/asuicon.jpg",
  },
  {
    title: "Research Technology Support Representative",
    company: "Knowledge Enterprise, Arizona State University",
    duration: "September 2024 - Present",
    description: "Knowledge Enterprise is the research arm of Arizona State University.",
    logoUrl: "/logos/asuicon.jpg",
  },
  {
    title: "Sponsor Coordinator",
    company: "PyBay",
    duration: "June 2022 - June 2023",
    description: "PyBay is the premier Python conference in the San Francisco Bay Area.",
    logoUrl: "/logos/pybay_logo.jpg",
  },
  {
    title: "Computer Lab Assistant",
    company: "De Anza College",
    duration: "January 2023 - March 2023",
    description: "De Anza College is a public community college in Cupertino, California.",
    logoUrl: "/logos/de_anza.jpg",
  },
  {
    title: "Database Intern",
    company: "Golden Gate University",
    duration: "July 2022 - February 2023",
    description: "Golden Gate University is a private university in San Francisco, California.",
    logoUrl: "/logos/golden_gate_university_logo.jpg",
  },
];

type EducationEntry = {
  degree: string;
  institution: string;
  duration: string;
  status: string;
};

const educationEntries: EducationEntry[] = [
  {
    degree: "BS in Computer Science",
    institution: "Arizona State University",
    duration: "August 2023 - May 2026",
    status: "Completed coursework in progress",
  },
  {
    degree: "PhD in Computer Science",
    institution: "Arizona State University",
    duration: "August 2026 - Present",
    status: "Incoming / current research track",
  },
];

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  lead: string;
  titleId: string;
};

function SectionHeader({ eyebrow, lead, title, titleId }: SectionHeaderProps) {
  return (
    <header className={styles.sectionHeader}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.sectionTitle} id={titleId}>
        {title}
      </h2>
      <p className={styles.sectionLead}>{lead}</p>
    </header>
  );
}

export function EducationSection() {
  return (
    <section aria-labelledby="education-title" className={styles.section} id="education">
      <div className={styles.sectionInner}>
        <SectionHeader
          eyebrow="Academics"
          title="Education"
          titleId="education-title"
          lead="Two focused milestones that frame the academic side of the work."
        />

        <div className={styles.educationGrid}>
          {educationEntries.map((entry) => (
            <article className={styles.educationCard} key={entry.degree}>
              <div className={styles.educationHeader}>
                <span className={styles.educationMark} aria-hidden="true">
                  <FaGraduationCap />
                </span>
                <div className={styles.educationMeta}>
                  <p className={styles.educationInstitution}>{entry.institution}</p>
                  <h3 className={styles.educationStatus}>{entry.degree}</h3>
                </div>
                <span className={styles.educationBadge}>{entry.duration}</span>
              </div>

              <p className={styles.educationSummary}>{entry.status}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExperienceTimelineSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { amount: 0.3, once: true });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="experience-title" className={styles.section} id="experience" ref={sectionRef}>
      <div className={styles.sectionInner}>
        <SectionHeader
          eyebrow="Career"
          title="Experience"
          titleId="experience-title"
          lead="A compact timeline of work and research that opens up as you reach it."
        />

        <motion.ol
          aria-label="Experience timeline"
          className={`${styles.timelineRail} ${isInView ? styles.timelineRailExpanded : ""}`}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
        >
          {experienceEntries.map((entry, index) => (
            <motion.li
              className={styles.timelineItem}
              key={`${entry.title}-${entry.company}`}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : index * 0.06, ease: "easeOut" }}
            >
              <article className={styles.timelineCard}>
                <div className={styles.timelineTopRow}>
                  <span className={styles.timelineIndex}>{String(index + 1).padStart(2, "0")}</span>
                  <p className={styles.timelineDuration}>{entry.duration}</p>
                </div>

                <div className={styles.timelineBody}>
                  <img
                    alt={`${entry.company} logo`}
                    className={styles.timelineLogo}
                    height={48}
                    loading="lazy"
                    src={entry.logoUrl}
                    width={48}
                  />
                  <div className={styles.timelineCopy}>
                    <h3 className={styles.timelineTitle}>{entry.title}</h3>
                    <h4 className={styles.timelineCompany}>{entry.company}</h4>
                  </div>
                </div>

                <p className={styles.timelineDescription}>{entry.description}</p>
              </article>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
