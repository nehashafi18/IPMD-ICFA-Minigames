import { useCallback, useEffect, useState } from "react";

import GalleryApp from "./routes/GalleryApp";
import { EnterPage } from "./routes/EnterPage";
import { HomePage } from "./routes/HomePage";
import ImageCardsPage from "./routes/ImageCardsPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import MiniGame from "./components/miniGames/src/MiniGames";

function currentPath() {
  return window.location.pathname;
}

export default function App() {
  const [path, setPath] = useState(currentPath());

  const navigate = useCallback((nextPath: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, "", nextPath);
    } else {
      window.history.pushState({}, "", nextPath);
    }

    setPath(currentPath());
  }, []);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (path === "/minigames") {
    return <MiniGame />;
  }

  if (path === "/enter") {
    return <EnterPage navigate={navigate} />;
  }

  if (path === "/image-cards") {
    return <ImageCardsPage />;
  }

  if (path === "/gallery") {
    return (
      <ProtectedRoute navigate={navigate}>
        <GalleryApp />
      </ProtectedRoute>
    );
  }

  return <HomePage navigate={navigate} />;
}