import { motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FaGraduationCap } from "react-icons/fa";
import { useRef, useState, useEffect } from "react";
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
};

const educationEntries: EducationEntry[] = [
  {
    degree: "BS in Computer Science",
    institution: "Arizona State University",
    duration: "August 2023 - May 2026",
  },
  {
    degree: "PhD in Computer Science",
    institution: "Arizona State University",
    duration: "August 2026 - Present",
  },
];

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  titleId: string;
};

function SectionHeader({ eyebrow, lead, title, titleId }: SectionHeaderProps) {
  return (
    <header className={styles.sectionHeader}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.sectionTitle} id={titleId}>
        {title}
      </h2>
      {lead && <p className={styles.sectionLead}>{lead}</p>}
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExperienceTimelineSection() {
  const targetRef = useRef<HTMLElement | null>(null);
  const carouselRef = useRef<HTMLOListElement | null>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  
  const isInView = useInView(targetRef, { amount: 0.1, once: true });
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  const { scrollYProgress: enterProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "start start"]
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollWidth]);
  const scale = useTransform(enterProgress, [0, 1], [0.85, 1]);
  const borderRadius = useTransform(enterProgress, [0, 1], [40, 0]);

  useEffect(() => {
    const measure = () => {
      if (carouselRef.current && carouselRef.current.parentElement) {
        const railWidth = carouselRef.current.scrollWidth;
        const wrapperWidth = carouselRef.current.parentElement.clientWidth;
        setScrollWidth(Math.max(0, railWidth - wrapperWidth));
      }
    };
    
    measure();
    setTimeout(measure, 100);
    setTimeout(measure, 500);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section aria-labelledby="experience-title" className={styles.experienceScrollTrack} id="experience" ref={targetRef}>
      <div className={styles.experienceSticky}>
        <motion.div 
          className={styles.experienceStickyInner}
          style={shouldReduceMotion ? {} : { scale, borderRadius }}
        >
          <div className={styles.experienceSectionInner}>
            <SectionHeader
              eyebrow="Career"
              title="Experience"
              titleId="experience-title"
            />

            <div className={styles.timelineWrapper}>
              <motion.ol
                aria-label="Experience timeline"
                className={styles.timelineRail}
                ref={carouselRef}
                style={{ x: shouldReduceMotion ? 0 : x }}
              >
                {experienceEntries.map((entry, index) => (
                  <motion.li
                    className={styles.timelineItem}
                    key={`${entry.title}-${entry.company}`}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : index * 0.06, ease: "easeOut" }}
                  >
                    <div className={styles.timelineNodeContainer}>
                      <p className={styles.timelineAxisDate}>{entry.duration}</p>
                      <div className={styles.timelineAxisTrack}>
                        <div className={styles.timelineAxisDot} />
                        <div className={styles.timelineAxisLine} />
                      </div>
                    </div>

                    <article className={styles.timelineCard}>
                      <div className={styles.timelineTopRow}>
                        <span className={styles.timelineIndex}>{String(index + 1).padStart(2, "0")}</span>
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}
