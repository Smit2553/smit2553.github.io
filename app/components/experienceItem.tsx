import styles from "./experienceItem.module.css";
import { motion } from "framer-motion";

export default function ExperienceItem(props: {
  title: string;
  company: string;
  duration: string;
  description: string;
}) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.header}>
        <motion.h3 variants={textVariants}>{props.title}</motion.h3>
        <motion.h4 className={styles.duration} variants={textVariants}>
          {props.duration}
        </motion.h4>
      </div>
      <motion.h4 variants={textVariants}>{props.company}</motion.h4>
      <motion.p variants={textVariants}>{props.description}</motion.p>
    </motion.div>
  );
}
