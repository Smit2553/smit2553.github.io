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
      <div className={styles.container}>
        <ProjectItem
          title="Smit's Personal Website"
          description="My personal website built to showcase my projects and my resume."
          link="https://github.com/Smit2553/smit2553.github.io"
          techStack="Next.js, TypeScript"
        />
        <ProjectItem
          title="Dialogue Social"
          description="Dialogue Social is an all purpose social media front-end."
          link="https://github.com/Smit2553/dialogue-social"
          techStack="Flutter, Dart"
        />
        <ProjectItem
          title="Deadline.AI"
          description="AI powered calendar app that helps you manage your time better."
          link="https://github.com/Smit2553/deadline.ai-frontend"
          techStack="React Native, TypeScript, Python"
        />
        <ProjectItem
          title="Fiber"
          description="AI powered nutrition app that helps you manage your diet better."
          link="https://github.com/Smit2553/Fiber"
          techStack="React Native, TypeScript, Python, Flask"
          image="/fiberimage.png"
        />
      </div>
    </div>
  );
}
