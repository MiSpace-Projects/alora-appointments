import Link from "next/link";

export default function ProfilePage() {
  return (
    <div style={{ padding: "3rem 1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>My Profile</h1>
      <p>Welcome to your profile page. Update your account details and review recent activity here.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/" style={{ color: "#4f46e5", textDecoration: "underline" }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
