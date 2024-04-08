import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <div>
        <h3>Presenting,</h3>
        <h1>Smit Devrukhkar</h1>
        <p>Developer</p>
      </div>
      <div className={styles.imageContainer}>
        <Image
          className={styles.profilepicture}
          src="/profilepicture.jpg"
          alt="Picture of the author"
          layout="fill"
          objectFit="contain"
        />
      </div>
    </div>
  );
}
