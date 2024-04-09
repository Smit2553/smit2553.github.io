import Image from "next/image";
import styles from "./page.module.css";
import ProjectItem from "../components/projectItem";

export default function Projects() {
  return (
    <div className={styles.container}>
      <ProjectItem
        title="Project 1"
        description="Description of project 1"
        link="https://www.example.com"
        techStack="Tech stack of project 1"
      />
      <ProjectItem
        title="Project 2"
        description="Description of project 2"
        link="https://www.example.com"
        techStack="Tech stack of project 2"
      />
    </div>
  );
}
