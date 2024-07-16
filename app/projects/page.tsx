"use client";

import Image from "next/image";
import styles from "./page.module.css";
import ProjectItem from "../components/projectItem";
import Header from "../components/header";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Projects() {
  return (
    <div>
      <Header backlink="/" />
      <motion.div className={styles.container}>
        <ProjectItem
          title="Sip & Play | Codedex Summer Hackathon 2024 UI/UX Winner"
          description="Codédex Hack 2024 Winner: Website for a board game shop serving boba tea and small bites in Park Slope, Brooklyn."
          links={{
            github: "https://github.com/LuaanNguyen/Board-Game-Cafe-Website",
            live: "https://board-game-cafe-website.vercel.app/",
          }}
          image="/sipnplaypicture.png"
          techStack="React.js, Three.js, Tailwind CSS, Vite"
        />
        <ProjectItem
          title="Smit's Personal Website"
          description="My personal website built to showcase my projects and my resume."
          links={{ github: "https://github.com/Smit2553/smit2553.github.io" }}
          image=""
          techStack="Next.js, TypeScript"
        />
        <ProjectItem
          title="Dialogue Social"
          description="Dialogue Social is an all purpose social media front-end."
          links={{ github: "https://github.com/Smit2553/dialogue-social" }}
          image=""
          techStack="Flutter, Dart"
        />
        <ProjectItem
          title="Deadline.AI"
          description="AI powered calendar app that helps you manage your time better."
          links={{ github: "https://github.com/Smit2553/deadline.ai-frontend" }}
          techStack="React Native, TypeScript, Python"
          image=""
        />
        <ProjectItem
          title="Fiber"
          description="AI powered nutrition app that helps you manage your diet better."
          links={{ github: "https://github.com/Smit2553/Fiber" }}
          techStack="React Native, TypeScript, Python, Flask"
          image="/fiberimage.png"
        />
      </motion.div>
    </div>
  );
}
