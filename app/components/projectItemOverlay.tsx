import React from "react";
import styles from "./projectItemOverlay.module.css";
import { motion } from "framer-motion";
import Image from "next/image";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ProjectItemOverlay(props: {
  title: string;
  description: string;
  links?: {
    github?: string;
    live?: string;
  };
  techStack: string;
  image: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className={styles.projectContainer}>
        <motion.img
          src={props.image}
          alt={props.title}
          className={styles.image}
          variants={staggerItem}
        />

        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.a
            onClick={() => props.setIsOpen(false)}
            target="_blank"
            className={styles.exitIcon}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variants={staggerItem}
          >
            <Image
              src="/icons/cross-circle.svg"
              alt="Live Website"
              width={30}
              height={30}
              className={styles.icon}
              style={{
                maxWidth: "100%",
                height: "auto",
                backgroundColor: "#eeeeee",
                borderRadius: "50%",
              }}
            />
          </motion.a>
          <motion.div className={styles.container1} variants={staggerContainer}>
            <motion.h3 variants={staggerItem}>{props.title}</motion.h3>
            <motion.p variants={staggerItem}>{props.techStack}</motion.p>
            <motion.p variants={staggerItem}>{props.description}</motion.p>
            <motion.div className={styles.container2} variants={staggerItem}>
              {props.links?.github && (
                <motion.a
                  href={props.links.github}
                  target="_blank"
                  className={styles.iconContainer}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  variants={staggerItem}
                >
                  <Image
                    src="/icons/logo-github.svg"
                    alt="Github"
                    width={30}
                    height={30}
                    className={styles.icon}
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                </motion.a>
              )}
              {props.links?.live && (
                <motion.a
                  href={props.links.live}
                  target="_blank"
                  className={styles.iconContainer}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  variants={staggerItem}
                >
                  <Image
                    src="/icons/logo-web.svg"
                    alt="Live Website"
                    width={30}
                    height={30}
                    className={styles.icon}
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                </motion.a>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
