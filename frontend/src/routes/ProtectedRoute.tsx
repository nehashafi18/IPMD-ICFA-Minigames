import { ReactNode, useEffect, useState } from "react";

import { getSessionStatus } from "../api/vms";
import "../App.css";

type ProtectedRouteProps = {
  children: ReactNode;
  navigate: (path: string, replace?: boolean) => void;
};

export function ProtectedRoute({ children, navigate }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSessionStatus()
      .then(() => {
        setChecking(false);
      })
      .catch(() => {
        navigate("/", true);
      });
  }, [navigate]);

  if (checking) {
    return (
      <div className="appPage">
        <main className="publicShell">
          <p className="publicEyebrow">Checking access</p>
          <h1 className="publicTitle">Please wait</h1>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
