"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { motion } from "framer-motion";
import ProjectItem from "./components/projectItem";
import ExperienceItem from "./components/experienceItem";
import { FaReact, FaPython } from "react-icons/fa";
import {
  TbBrandThreejs,
  TbBrandVite,
  TbBrandReactNative,
  TbBrandNextjs,
  TbBrandFlutter,
  TbSql,
} from "react-icons/tb";
import { RiTailwindCssFill } from "react-icons/ri";
import {
  SiTypescript,
  SiFlask,
  SiDart,
  SiJavascript,
  SiFastapi,
  SiOpenai,
  SiModal,
} from "react-icons/si";
import { GrGoogle } from "react-icons/gr";
import { PiOpenAiLogo } from "react-icons/pi";

export default function Home() {
  return (
    <div>
      <div className={styles.container}>
        <div>
          <h2>Presenting,</h2>
          <h1 style={{ fontSize: "3rem" }}>Smit Devrukhkar</h1>
          <h2>Software Engineer, Tech Enthusiast</h2>
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
          <img
            className={styles.profilepicture}
            src="/profilepicture.png"
            alt="Picture of the author"
          />
        </div>
      </div>
      <div className={styles.moduleContainer}>
        <h1 className={styles.moduleTitle} id="projects">
          Projects
        </h1>
      </div>

      <div className={styles.projectContainer}>
        <ProjectItem
          title="Master Vault | HackPrinceton Spring 2025 Winner"
          description="Winner for Best AI/LLM Inference hosted on Modal. Transform digital distraction into productive learning through AI-powered podcast experiences"
          links={{
            github: "https://github.com/Smit2553/master-vault",
            live: "https://devpost.com/software/master-vault",
          }}
          image="/princeton2025.png"
          techStack={[
            "Google Gemini",
            "OpenAI Whisper",
            "Modal",
            "FastAPI",
            "SQLite3",
            "React Native",
          ]}
          icons={[
            <GrGoogle size={30} key={1} />,
            <SiOpenai size={30} key={2} />,
            <SiModal size={30} key={3} />,
            <SiFastapi size={30} key={4} />,
            <TbSql size={30} key={5} />,
            <TbBrandReactNative size={30} key={6} />,
          ]}
        />
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
            <FaReact size={30} key={1} />,
            <TbBrandThreejs size={30} key={2} />,
            <RiTailwindCssFill size={30} key={3} />,
            <TbBrandVite size={30} key={4} />,
          ]}
        />
        <ProjectItem
          title="HealthSync | HackMIT 2024"
          description="Synchronizing hospital resources for efficient, patient-centered care."
          links={{
            github: "https://github.com/jspnguyen/HealthSync",
            live: "https://healthsync.codestacx.com/",
          }}
          techStack={[
            "React.js",
            "JavaScript",
            "Tailwind CSS",
            "Vite",
            "Python",
            "FastAPI",
          ]}
          icons={[
            <FaReact size={30} key={1} />,
            <SiJavascript size={30} key={2} />,
            <RiTailwindCssFill size={30} key={3} />,
            <TbBrandVite size={30} key={4} />,
            <FaPython size={30} key={5} />,
            <SiFastapi size={30} key={6} />,
          ]}
          image="/HealthSync.jpg"
        />
        <ProjectItem
          title="Fiber | UC Berkeley AI Hackathon 2024"
          description="AI powered nutrition app that helps you manage your diet better."
          links={{ github: "https://github.com/Smit2553/Fiber" }}
          techStack={["React Native", "TypeScript", "Python", "Flask"]}
          icons={[
            <TbBrandReactNative size={30} key={1} />,
            <SiTypescript size={30} key={2} />,
            <FaPython size={30} key={3} />,
            <SiFlask size={30} key={4} />,
          ]}
          image="/fiberimage.png"
        />
        <ProjectItem
          title="Smit's Personal Website"
          description="My personal website built to showcase my projects and my resume."
          links={{ github: "https://github.com/Smit2553/smit2553.github.io" }}
          image="/personalwebsitepicture.jpg"
          techStack={["Next.js", "TypeScript"]}
          icons={[
            <TbBrandNextjs size={30} key={1} />,
            <SiTypescript size={30} key={2} />,
          ]}
        />
        <ProjectItem
          title="Dialogue Social"
          description="Dialogue Social is an all purpose social media front-end."
          links={{ github: "https://github.com/Smit2553/dialogue-social" }}
          image="/dialogue.png"
          techStack={["Flutter", "Dart"]}
          icons={[
            <TbBrandFlutter size={30} key={1} />,
            <SiDart size={30} key={2} />,
          ]}
        />
        <ProjectItem
          title="Deadline.AI"
          description="AI powered calendar app that helps you manage your time better."
          links={{ github: "https://github.com/Smit2553/deadline.ai-frontend" }}
          techStack={["React Native", "TypeScript", "Python"]}
          icons={[
            <TbBrandReactNative size={30} key={1} />,
            <SiTypescript size={30} key={2} />,
            <FaPython size={30} key={3} />,
          ]}
          image="/deadline.png"
        />
      </div>
      <h1 className={styles.moduleTitle} id="experience">
        Experience
      </h1>
      <div className={styles.experienceContainer}>
        <ExperienceItem
          title="Research Technology Support Representative"
          company="Knowledge Enterprise, Arizona State University"
          duration="September 2024 - Present"
          description="Knowledge Enterprise is the research arm of Arizona State University."
          logoUrl="/logos/asuicon.jpg"
        />
        <ExperienceItem
          title="Sponsor Coordinator"
          company="PyBay"
          duration="June 2022 - June 2023"
          description="PyBay is the premier Python conference in the San Francisco Bay Area."
          logoUrl="/logos/pybay_logo.jpg"
        />
        <ExperienceItem
          title="IT Support"
          company="De Anza College"
          duration="January 2023 - March 2023"
          description="De Anza College is a public community college in Cupertino, California."
          logoUrl="/logos/de_anza.jpg"
        />
        <ExperienceItem
          title="Technical Support Intern"
          company="Golden Gate University"
          duration="July 2022 - February 2023"
          description="Golden Gate University is a private university in San Francisco, California."
          logoUrl="/logos/golden_gate_university_logo.jpg"
        />
      </div>
    </div>
  );
}
