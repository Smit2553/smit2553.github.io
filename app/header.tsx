import { headers } from "next/headers";

export default function Header() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.name}>Smit Devrukhkar</h1>
        <h2 className={styles.subtitle}>Computer Science Student</h2>
        <div className={styles.links}>
          <a href="