import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(
    process.cwd(),
    ".env"
  )
});

import app from "./app.js";

const PORT: number = Number(
  process.env.PORT || 5001
);

app.listen(PORT, (): void => {
  console.log(
    `Server running on port ${PORT}`
  );
});