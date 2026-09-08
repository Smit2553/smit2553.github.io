import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { Link } from "react-router-dom";
import { FaFileAudio, FaPython, FaReact } from "react-icons/fa";
import { GrGoogle } from "react-icons/gr";
import { MdEmail } from "react-icons/md";
import { RiTailwindCssFill } from "react-icons/ri";
import {
  SiElevenlabs,
  SiFastapi,
  SiFlask,
  SiJavascript,
  SiModal,
  SiOpenai,
  SiTypescript,
} from "react-icons/si";
import {
  TbBrandReactNative,
  TbBrandThreejs,
  TbBrandVite,
  TbSql,
} from "react-icons/tb";
import LatestWritingSection from "../components/blog/LatestWritingSection";
import { EducationSection, ExperienceTimelineSection } from "../components/homeSections";
import ProjectItem from "../components/projectItem";
import styles from "../App.module.css";

export default function HomePage() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  const handleProjectToggle = useCallback((projectId: string): void => {
    setOpenProjectId((current) => (current === projectId ? null : projectId));
  }, []);

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Presenting,</p>
          <h1 className={styles.title}>Smit Devrukhkar</h1>
          <h2 className={styles.heroSubtitle}>
            <TypeAnimation
              sequence={[
                "Technology Enthusiast",
                2000,
                "Researcher",
                2000,
                "Software Engineer",
                2000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
            />
          </h2>
          <p className={styles.heroDescription}>Student at Arizona State University</p>
          <div className={styles.navLinks}>
            <motion.a href="#projects" className={styles.navPill} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Projects
            </motion.a>
            <motion.a href="#education" className={styles.navPill} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Education
            </motion.a>
            <motion.a href="#experience" className={styles.navPill} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Experience
            </motion.a>
            <Link className={styles.navPill} to="/blog">
              Blog
            </Link>
          </div>
          
          <div className={styles.actionRow}>
            <div className={styles.socialLinks}>
              <motion.a href="https://github.com/Smit2553" target="_blank" rel="noreferrer" className={styles.iconLink} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <img src="/icons/logo-github.svg" alt="Github" width={28} height={28} className={styles.icon} />
              </motion.a>
              <motion.a href="https://www.linkedin.com/in/smitsd/" target="_blank" rel="noreferrer" className={styles.iconLink} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <img src="/icons/logo-linkedin.svg" alt="LinkedIn" width={28} height={28} className={styles.icon} />
              </motion.a>
            </div>
            
            <div className={styles.emailContainer}>
              <motion.a href="mailto:smitdev3@gmail.com" className={styles.emailLink} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <MdEmail size={18} className={styles.emailIcon} />
                smitdev3@gmail.com
              </motion.a>
              <motion.a href="mailto:ssdevruk@asu.edu" className={styles.emailLink} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <MdEmail size={18} className={styles.emailIcon} />
                ssdevruk@asu.edu
              </motion.a>
            </div>
          </div>
        </div>

        <div className={styles.imageContainer}>
          <picture>
            <source srcSet="/profilepicture.avif" type="image/avif" />
            <img
              src="/profilepicture.jpg"
              alt="Smit Devrukhkar"
              width={400}
              height={400}
            />
          </picture>
        </div>
      </div>

      <div className={styles.moduleContainer}>
        <h1 className={styles.moduleTitle} id="projects">
          Projects
        </h1>
      </div>

      <div className={styles.projectContainer}>
        <ProjectItem
          id="master-vault"
          title="Master Vault | HackPrinceton Spring 2025 Winner"
          description="Winner for Best AI/LLM Inference hosted on Modal. Transform digital distraction into productive learning through AI-powered podcast experiences"
          links={{
            github: "https://github.com/Smit2553/master-vault",
            live: "https://devpost.com/software/master-vault",
          }}
          image="/princeton2025.png"
          optimizedImage="/princeton2025.avif"
          imageHeight={1080}
          imageWidth={1920}
          techStack={[
            "Google Gemini",
            "OpenAI Whisper",
            "Modal",
            "FastAPI",
            "SQLite3",
            "React Native",
          ]}
          icons={[
            <GrGoogle size={30} />,
            <SiOpenai size={30} />,
            <SiModal size={30} />,
            <SiFastapi size={30} />,
            <TbSql size={30} />,
            <TbBrandReactNative size={30} />,
          ]}
          isExpanded={openProjectId === "master-vault"}
          onToggle={handleProjectToggle}
        />
        <ProjectItem
          id="offscript"
          title="Offscript | HackHarvard 2025"
          description="Practice Technical Interviews how they actually happen, through natural conversation."
          links={{
            github: "https://github.com/Smit2553/Offscript",
            live: "https://offscript.codestacx.com/",
          }}
          image="/offscript.png"
          optimizedImage="/offscript.avif"
          imageHeight={2000}
          imageWidth={3000}
          techStack={["Elevenlabs", "Google Gemini", "FastAPI", "Vapi"]}
          icons={[
            <SiElevenlabs size={30} />,
            <GrGoogle size={30} />,
            <SiFastapi size={30} />,
            <FaFileAudio size={30} />,
          ]}
          isExpanded={openProjectId === "offscript"}
          onToggle={handleProjectToggle}
        />
        <ProjectItem
          id="sip-and-play"
          title="Sip & Play | Codedex Summer Hackathon 2024 UI/UX Winner"
          description="Codédex Hack 2024 Winner: Website for a board game shop serving boba tea and small bites in Park Slope, Brooklyn."
          links={{
            github: "https://github.com/LuaanNguyen/Board-Game-Cafe-Website",
            live: "https://board-game-cafe-website.vercel.app/",
          }}
          image="/sipnplaypicture.png"
          optimizedImage="/sipnplaypicture.avif"
          imageHeight={640}
          imageWidth={1280}
          techStack={["React.js", "Three.js", "Tailwind CSS", "Vite"]}
          icons={[
            <FaReact size={30} />,
            <TbBrandThreejs size={30} />,
            <RiTailwindCssFill size={30} />,
            <TbBrandVite size={30} />,
          ]}
          isExpanded={openProjectId === "sip-and-play"}
          onToggle={handleProjectToggle}
        />
        <ProjectItem
          id="healthsync"
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
            <FaReact size={30} />,
            <SiJavascript size={30} />,
            <RiTailwindCssFill size={30} />,
            <TbBrandVite size={30} />,
            <FaPython size={30} />,
            <SiFastapi size={30} />,
          ]}
          image="/HealthSync.jpg"
          optimizedImage="/HealthSync.avif"
          imageHeight={540}
          imageWidth={960}
          isExpanded={openProjectId === "healthsync"}
          onToggle={handleProjectToggle}
        />
        <ProjectItem
          id="fiber"
          title="Fiber | UC Berkeley AI Hackathon 2024"
          description="AI powered nutrition app that helps you manage your diet better."
          links={{ github: "https://github.com/Smit2553/Fiber" }}
          techStack={["React Native", "TypeScript", "Python", "Flask"]}
          icons={[
            <TbBrandReactNative size={30} />,
            <SiTypescript size={30} />,
            <FaPython size={30} />,
            <SiFlask size={30} />,
          ]}
          image="/fiberimage.jpg"
          optimizedImage="/fiberimage.avif"
          imageHeight={1362}
          imageWidth={2304}
          isExpanded={openProjectId === "fiber"}
          onToggle={handleProjectToggle}
        />
        <ProjectItem
          id="personal-website"
          title="Smit's Personal Website"
          description="My personal website built to showcase my projects and my resume."
          links={{ github: "https://github.com/Smit2553/smit2553.github.io" }}
          image="/personalwebsitepicture.jpg"
          optimizedImage="/personalwebsitepicture.avif"
          imageHeight={1440}
          imageWidth={2560}
          techStack={["Vite", "React", "TypeScript"]}
          icons={[
            <TbBrandVite size={30} />,
            <FaReact size={30} />,
            <SiTypescript size={30} />,
          ]}
          isExpanded={openProjectId === "personal-website"}
          onToggle={handleProjectToggle}
        />
      </div>

      <LatestWritingSection />

      <EducationSection />

      <ExperienceTimelineSection />
    </div>
  );
}
