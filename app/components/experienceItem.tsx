import styles from "./experienceItem.module.css";
import { motion } from "framer-motion";

export default function ExperienceItem({
  title,
  company,
  duration,
  description,
  logoUrl,
}: {
  title: string;
  company: string;
  duration: string;
  description: string;
  logoUrl: string; // Added logo prop
}) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.25,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.article
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <header className={styles.header}>
        <motion.h3 variants={textVariants} className={styles.title}>
          {title}
        </motion.h3>
        <motion.h4 className={styles.duration} variants={textVariants}>
          {duration}
        </motion.h4>
      </header>
      <div className={styles.content}>
        {logoUrl && (
          <motion.img
            src={logoUrl}
            alt={`${company} logo`}
            className={styles.logo}
            variants={textVariants}
          />
        )}
        <div className={styles.textContent}>
          <motion.h4 className={styles.company} variants={textVariants}>
            {company}
          </motion.h4>
          <motion.p className={styles.description} variants={textVariants}>
            {description}
          </motion.p>
        </div>
      </div>
    </motion.article>
  );
}
