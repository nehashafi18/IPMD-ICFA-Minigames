import "../App.css";

type HomePageProps = {
  navigate: (nextPath: string, replace?: boolean) => void;
};

export function HomePage({ navigate }: HomePageProps) {
  return (
    <div className="appPage">
      <main className="publicShell">
        <p className="publicEyebrow">Image Cards to Fine Art</p>

        <h1 className="publicTitle">Access required</h1>

        <p className="publicCopy">
          This preview is currently gated for internal visitors.
          Use a valid entry link from the VMS admin console to
          open the image cards experience.
        </p>

        <button
          className="primaryButton"
          onClick={() => navigate("/image-cards")}
        >
          Go to Image Cards
        </button>
      </main>
    </div>
  );
}