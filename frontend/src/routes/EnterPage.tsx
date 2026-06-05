import { useEffect, useRef, useState } from "react";

import { validateEntry } from "../api/vms";
import "../App.css";

type EnterPageProps = {
  navigate: (path: string, replace?: boolean) => void;
};

export function EnterPage({ navigate }: EnterPageProps) {
  const [message, setMessage] = useState("Checking your entry token...");
  const validationStarted = useRef(false);

  useEffect(() => {
    if (validationStarted.current) {
      return;
    }

    validationStarted.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setMessage("This entry link is missing a token.");
      return;
    }

    validateEntry(token)
      .then((result) => {
        if (!result.allowed) {
          setMessage("This entry link is not valid.");
          return;
        }

        setMessage("Access granted. Opening image cards...");
        navigate(result.redirectTo || "/image-cards", true);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to validate this entry link."
        );
      });
  }, [navigate]);

  return (
    <div className="appPage">
      <main className="publicShell">
        <p className="publicEyebrow">Visitor entry</p>
        <h1 className="publicTitle">Validating access</h1>
        <p className="publicCopy">{message}</p>
      </main>
    </div>
  );
}
