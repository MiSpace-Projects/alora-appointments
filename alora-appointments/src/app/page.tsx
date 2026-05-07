import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.landing}>
      <h1>Welcome to Alora Appointments</h1>
      <p>Book your beauty services with ease.</p>
    </div>
  );
}
 