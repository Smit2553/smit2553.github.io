import Image from "next/image";
import styles from "./page.module.css";
import ResumeItem from "../components/resumeItem";

export default function Projects() {
  return (
    <div>
      <h1>Education</h1>
      <ResumeItem
        title="Arizona State Univeristy"
        date="Aug. 2023 - Present"
        location="Tempe, AZ"
        description="Bachelor of Science in Computer Science"
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
      <h1>Experience</h1>
      <ResumeItem
        title="Arizona State Univeristy"
        date="Aug. 2023 - Present"
        location="Tempe, AZ"
        description="Bachelor of Science in Computer Science"
      />
      <ResumeItem
        title="Sponsor Coordinator"
        position="PyBay"
        date="July 2022 - Present"
        location="San Francisco, CA"
        description="Temp"
      />
    </div>
  );
}
