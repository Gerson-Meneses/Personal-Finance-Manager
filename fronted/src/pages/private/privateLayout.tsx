import { useAuth } from "../../features/auth/authContext";
import "./privayeLayout.css"

export function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  return (
    <>
      <header>
        <h2>Finance App - {user?.name}</h2>
        <button className="cursorPointer" onClick={logout}>Logout</button>
      </header>

      <main>{children}</main>

      <footer>GEMA© 2026</footer>
    </>
  );
}
