import Image from "next/legacy/image";
import styles from "./page.module.css";
import ResumeItem from "../components/resumeItem";
import Header from "../components/header";

export const metadata = {
  title: "Smit's Resume",
  description: "Resume Page in the Personal website of Smit Devrukhkar",
};

export default function Projects() {
  return (
    <div>
      <Header backlink="/" />
      <div className={styles.container}>
        <div>
          <h1>Education</h1>
          <div className={styles.itemcontainer}>
            <ResumeItem
              title="Arizona State Univeristy"
              date="Aug. 2023 - Present"
              location="Tempe, AZ"
              description="BS in Computer Science"
            />
            <ResumeItem
              title="De Anza College"
              date="Aug. 2021 - May. 2023"
              location="Cupertino, CA"
              description="Transfer to ASU - Computer Science"
            />
            <ResumeItem
              title="GEMS Modern Academy"
              date="April. 2009 - April 2021"
              location="Dubai, U.A.E"
              description="ICSE - Computer Science"
            />
          </div>
          <h1>Experience</h1>
          <div className={styles.itemcontainer}>
            <ResumeItem
              title="Sponsor Coordinator | PyBay"
              date="July 2022 - Present"
              location="San Francisco, CA"
              description="• Oversaw and coordinated PyBay's social media outreach on Twitter"
              description2="• Coordinated and executed both in-person and online events with excellent organizational and planning skills"
              description3="• Re-engaged with previous sponsors and cultivated strong relationships to secure event funding"
            />
            <ResumeItem
              title="IT Support Volunteer | De Anza Computer Lab/Donation Program"
              date="Jan. 2023 - Mar. 2023"
              location="Cupertino, CA"
              description="• Collaborated with a team of volunteers to refurbish and renew laptops for students in need"
              description2="• Provided guidance and training to students on computer components, repair methods, and data management"
            />
            <ResumeItem
              title="Technical Support Intern | Golden Gate University"
              date="July 2022 - Feb. 2023"
              location="San Francisco, CA"
              description="• Contributed to the development of a website for a new program that supports small businesses"
              description2="• Utilized WordPress to facilitate event scheduling and mailing list creation."
            />
          </div>
          <h1>Projects</h1>
          <div className={styles.itemcontainer}>
            <ResumeItem
              title="Personal Website"
              date="Perpetuity"
              description="• Clean and concise personal portfolio website showcasing my education, skills, projects, and 
        professional experience"
              description2="• Implemented a responsive design for mobile and desktop users"
              description3="• Utilized Next.js, React, and CSS modules for styling"
            />
            <ResumeItem
              title="Dialogue Social"
              date="June 2023"
              description="• Development of a hybrid shortform/longform content social media application using Flutter and Dart."
              description2="• Employed the Flutter framework to create a dynamic and responsive user interface, ensuring a seamless and
          engaging user experience."
              description3="• Engaged in continuous testing and debugging processes to identify and resolve issues promptly, ensuring a stable
          and error-free application."
            />
          </div>
        </div>
        <div className={styles.flexborder}></div>
        <div>
          <h1>Additional Information</h1>
          <ResumeItem
            title="Programming Languages"
            description="Python, C/C++, Java, JavaScript, HTML/CSS  "
          />
          <ResumeItem
            title="Databases"
            description="Postgres, SQLite, MongoDB"
          />
          <ResumeItem
            title="Frameworks"
            description="React, React Native, Flutter, WordPress, FastAPI"
          />
          <ResumeItem
            title="Tools"
            description="Git, Docker, VS Code, PyCharm, IntelliJ, Android Studio, Microsoft Office, Photoshop"
          />
          <ResumeItem
            title="Operating Systems"
            description="Windows, MacOS, Linux"
          />
          <ResumeItem
            title="Contact Information"
            description="Email: smitdev3@gmail.com"
            description2="Phone: +1 669 388-1301"
          />
        </div>
      </div>
    </div>
  );
}
