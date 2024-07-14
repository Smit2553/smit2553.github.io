import styles from "./projectItem.module.css";
import { motion } from "framer-motion";
import { useState } from "react";
import ProjectItemOverlay from "./projectItemOverlay";

export default function ProjectItem(props: {
  title: string;
  description: string;
  link: string;
  techStack: string;
  image: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        className={styles.container}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div className={styles.container1}>
          <motion.h3>{props.title}</motion.h3>
          <p>{props.techStack}</p>
        </motion.div>
      </motion.div>

      {isOpen && (
        <ProjectItemOverlay
          title={props.title}
          description={props.description}
          link={props.link}
          techStack={props.techStack}
          image={props.image}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
      )}
    </>
  );
}
