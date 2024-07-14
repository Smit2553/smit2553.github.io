"use client";
export * from "framer-motion";
import Image from "next/image";
import styles from "./page.module.css";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className={styles.container}>
      <div>
        <h2>Presenting,</h2>
        <h1>Smit Devrukhkar</h1>
        <h2>Developer</h2>
        <div className={styles.container1}>
          <motion.a
            href="/projects"
            className={styles.link}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Projects
          </motion.a>
          <motion.a
            href="/resume"
            className={styles.link}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Resume
          </motion.a>
        </div>
        <div className={styles.container2}>
          <motion.a
            href="https://github.com/Smit2553"
            target="_blank"
            className={styles.iconContainer}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
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

          <motion.a
            href="https://www.linkedin.com/in/smitsd/"
            target="_blank"
            className={styles.iconContainer}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Image
              src="/icons/logo-linkedin.svg"
              alt="LinkedIn"
              width={30}
              height={30}
              className={styles.icon}
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </motion.a>
        </div>
      </div>

      <div className={styles.imageContainer}>
        <Image
          className={styles.profilepicture}
          src="/profilepicture.jpg"
          alt="Picture of the author"
          fill
          sizes="100vw"
        />
      </div>
    </div>
  );
}
