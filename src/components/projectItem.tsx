import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";
import styles from "./projectItem.module.css";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type ProjectItemProps = {
  title: string;
  description: string;
  links?: {
    github?: string;
    live?: string;
  };
  icons?: ReactNode[];
  techStack: string[];
  image: string;
  reverse?: boolean;
};

export default function ProjectItem(props: ProjectItemProps) {
  const [isContainerVisible, setContainerVisible] = useState(false);

  return (
    <motion.div
      className={styles.projectContainer}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1, transition: { duration: 0.3 } }}
      viewport={{ amount: 0.3, once: true }}
      onAnimationComplete={() => setContainerVisible(true)}
    >
      {!props.reverse && (
        <motion.img
          src={props.image}
          alt={props.title}
          className={styles.image}
          variants={staggerItem}
        />
      )}
      <motion.div
        className={
          props.reverse
            ? styles.contentContainerReverse
            : styles.contentContainer
        }
        variants={staggerContainer}
        initial="hidden"
        animate={isContainerVisible ? "show" : "hidden"}
      >
        <motion.h3 variants={staggerItem}>{props.title}</motion.h3>
        {props.techStack.length > 0 && (
          <motion.ul className={styles.techStackList} variants={staggerItem}>
            {props.techStack.map((tech, index) => (
              <motion.li
                key={tech}
                className={styles.techStackItem}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {props.icons?.[index] && (
                  <span className={styles.icon}>{props.icons[index]}</span>
                )}
                {tech}
              </motion.li>
            ))}
          </motion.ul>
        )}
        <motion.p variants={staggerItem}>{props.description}</motion.p>
        <motion.div className={styles.linksContainer} variants={staggerItem}>
          {props.links?.github && (
            <motion.a
              href={props.links.github}
              target="_blank"
              rel="noreferrer"
              className={styles.iconContainer}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              variants={staggerItem}
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
              variants={staggerItem}
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
      {props.reverse && (
        <motion.img
          src={props.image}
          alt={props.title}
          className={styles.image}
          variants={staggerItem}
        />
      )}
    </motion.div>
  );
}
