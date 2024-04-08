import styles from "./resumeItem.module.css";

export default function ResumeItem(props: {
  title: string;
  date?: string;
  description: string;
  location?: string;
  description2?: string;
  description3?: string;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.container1}>
        <div>
          <h3>{props.title}</h3>
          <p>{props.location}</p>
        </div>

        <h3>{props.date}</h3>
      </div>

      <div className={styles.container1}>
        <div>
          <p>{props.description}</p>
          <p>{props.description2}</p>
          <p>{props.description3}</p>
        </div>
      </div>
    </div>
  );
}
