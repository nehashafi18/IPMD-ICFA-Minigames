import "../App.css";

export function HomePage() {
  return (
    <div className="appPage">
      <main className="publicShell">
        <p className="publicEyebrow">Image Cards to Fine Art</p>
        <h1 className="publicTitle">Access required</h1>
        <p className="publicCopy">
          This preview is currently gated for internal visitors. Use a valid
          entry link from the VMS admin console to open the image cards
          experience.
        </p>
      </main>
    </div>
  );
}
