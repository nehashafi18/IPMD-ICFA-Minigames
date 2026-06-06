import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(
    process.cwd(),
    ".env"
  )
});

import app from "./app.js";
import { migrate } from "./vms/db.js";

const PORT: number = Number(
  process.env.PORT || 5001
);

migrate();

app.listen(PORT, (): void => {
  console.log(
    `Server running on port ${PORT}`
  );
  console.log(
    "VMS entry URL: /enter?token=<uuid>"
  );
});
