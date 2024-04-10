import Image from "next/image";
import styles from "./page.module.css";
import ProjectItem from "../components/projectItem";
import Header from "../components/header";

export const metadata = {
  title: "Smit's Projects",
  description: "Projects Page in the Personal website of Smit Devrukhkar",
};

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
      </div>
    </div>
  );
}
