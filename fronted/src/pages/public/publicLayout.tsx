import "./publicLayout.css"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="container">{children}</div>;
}
