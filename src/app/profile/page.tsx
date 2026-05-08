import Link from "next/link"
import styles from "./page.module.css"
import { profilePageCopy } from "./profileData"

export default function ProfilePage() {
  return (
    <div className={styles.profilePage}>
      <h1 className={styles.profileTitle}>{profilePageCopy.title}</h1>
      <p className={styles.profileText}>{profilePageCopy.description}</p>
      <div className={styles.profileActions}>
        <Link href={profilePageCopy.backLink.href} className={styles.profileLink}>
          {profilePageCopy.backLink.label}
        </Link>
      </div>
    </div>
  )
}
