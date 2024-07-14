import React from "react";
import styles from "./projectItemOverlay.module.css";
import { motion } from "framer-motion";

export default function ProjectItemOverlay(props: {
  title: string;
  description: string;
  link: string;
  techStack: string;
  image: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void; // Accept setIsOpen function as a prop
}) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => props.setIsOpen(false)}
    >
      <motion.div className={styles.projectContainer}>
        {" "}
        <img src={props.image} alt={props.title} className={styles.image} />
        <motion.div className={styles.container1}>
          <motion.h3>{props.title}</motion.h3>
          <p>{props.techStack}</p>
          <p>{props.description}</p>
          <motion.a
            href={props.link}
            target="_blank"
            className={styles.link}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            View Project
          </motion.a>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
