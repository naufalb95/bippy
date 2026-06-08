import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { BippyIcon } from "@/components/BippyIcon";
import { AdminApp } from "@/components/AdminApp";

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <BippyIcon size={44} />
          <div>
            <h1>
              Bippy<span className="bang">!</span> Admin
            </h1>
            <p className="sub">Flashcard deck manager</p>
          </div>
        </div>
        <div className="spacer" />
        <div className="user">
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" />
          )}
          <span>{user.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <AdminApp />
    </div>
  );
}
