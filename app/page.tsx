import Image from "next/image";
import styles from "./page.module.css";

export const metadata = {
  title: "Smit Devrukhkar",
  description: "Personal website of Smit Devrukhkar",
};

export default function Home() {
  return (
    <div className={styles.container}>
      <div>
        <h2>Presenting,</h2>
        <h1>Smit Devrukhkar</h1>
        <h2>Developer</h2>
        <div className={styles.container1}>
          <a href="/projects" className={styles.link}>
            Projects
          </a>
          <a href="/resume" className={styles.link}>
            Resume
          </a>
        </div>
        <div className={styles.container2}>
          <Image
            src="/icons/logo-github.svg"
            alt="Github"
            width={30}
            height={30}
            className={styles.icon}
          />
          <Image
            src="/icons/logo-linkedin.svg"
            alt="Github"
            width={30}
            height={30}
            className={styles.icon}
          />
        </div>
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
