"use client";
export * from "framer-motion";
import Image from "next/image";
import styles from "./page.module.css";
import { motion } from "framer-motion";
import ProjectItem from "./components/projectItem";
import { FaReact, FaPython } from "react-icons/fa";
import {
  TbBrandThreejs,
  TbBrandVite,
  TbBrandReactNative,
  TbBrandNextjs,
  TbBrandFlutter,
} from "react-icons/tb";
import { RiTailwindCssFill } from "react-icons/ri";
import { SiTypescript, SiFlask, SiDart } from "react-icons/si";

export default function Home() {
  return (
    <div>
      <div className={styles.container}>
        <div>
          <h2>Presenting,</h2>
          <h1 style={{ fontSize: "3rem" }}>Smit Devrukhkar</h1>
          <h2>Full-Stack Developer</h2>
          <h2>Student at Arizona State University</h2>
          <div className={styles.container1}>
            <motion.a
              href="#projects"
              className={styles.link}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Projects
            </motion.a>
            <motion.a
              href="#experience"
              className={styles.link}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Experience
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
      <h1 className={styles.moduleTitle} id="projects">
        Projects
      </h1>

      <div className={styles.projectContainer}>
        <ProjectItem
          title="Sip & Play | Codedex Summer Hackathon 2024 UI/UX Winner"
          description="Codédex Hack 2024 Winner: Website for a board game shop serving boba tea and small bites in Park Slope, Brooklyn."
          links={{
            github: "https://github.com/LuaanNguyen/Board-Game-Cafe-Website",
            live: "https://board-game-cafe-website.vercel.app/",
          }}
          image="/sipnplaypicture.png"
          techStack={["React.js", "Three.js", "Tailwind CSS", "Vite"]}
          icons={[
            <FaReact size={30} />,
            <TbBrandThreejs size={30} />,
            <RiTailwindCssFill size={30} />,
            <TbBrandVite size={30} />,
          ]}
        />
        <ProjectItem
          title="Fiber"
          description="AI powered nutrition app that helps you manage your diet better."
          links={{ github: "https://github.com/Smit2553/Fiber" }}
          techStack={["React Native", "TypeScript", "Python", "Flask"]}
          icons={[
            <TbBrandReactNative size={30} />,
            <SiTypescript size={30} />,
            <FaPython size={30} />,
            <SiFlask size={30} />,
          ]}
          image="/fiberimage.png"
        />
        <ProjectItem
          title="Smit's Personal Website"
          description="My personal website built to showcase my projects and my resume."
          links={{ github: "https://github.com/Smit2553/smit2553.github.io" }}
          image="/personalwebsitepicture.jpg"
          techStack={["Next.js", "TypeScript"]}
          icons={[<TbBrandNextjs size={30} />, <SiTypescript size={30} />]}
        />
        <ProjectItem
          title="Dialogue Social"
          description="Dialogue Social is an all purpose social media front-end."
          links={{ github: "https://github.com/Smit2553/dialogue-social" }}
          image="/dialogue.png"
          techStack={["Flutter", "Dart"]}
          icons={[<TbBrandFlutter size={30} />, <SiDart size={30} />]}
        />
        <ProjectItem
          title="Deadline.AI"
          description="AI powered calendar app that helps you manage your time better."
          links={{ github: "https://github.com/Smit2553/deadline.ai-frontend" }}
          techStack={["React Native", "TypeScript", "Python"]}
          icons={[
            <TbBrandReactNative size={30} />,
            <SiTypescript size={30} />,
            <FaPython size={30} />,
          ]}
          image="/deadline.png"
        />
      </div>
      <h1 className={styles.moduleTitle} id="experience">
        Experience
      </h1>
      <div className={styles.resumeContainer}></div>
    </div>
  );
}
