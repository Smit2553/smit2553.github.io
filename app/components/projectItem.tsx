import styles from "./projectItem.module.css";

export default function ProjectItem(props: {
  title: string;
  description: string;
  link: string;
  techStack: string;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.container1}>
        <h3>{props.title}</h3>
        <p>{props.techStack}</p>
        <div className={styles.border}></div>
      </div>

      <div className={styles.container1}>
        <p>{props.description}</p>
        <a href={props.link}>Source Code</a>
      </div>
    </div>
  );
}
