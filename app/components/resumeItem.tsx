import styles from "./resumeItem.module.css";

export default function ResumeItem(props: {
  title: string;
  date: string;
  description: string;
  location: string;
  position?: string;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.container1}>
        <h3>{props.title}</h3>
        <p>{props.description}</p>
      </div>
      <div className={styles.container1}>
        <div>
          <h3>{props.location}</h3>
          <h3>{props.position}</h3>
        </div>
        <p>{props.date}</p>
      </div>
    </div>
  );
}
