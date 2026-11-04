import "dotenv/config";
import app from "./app.js";
const port = Number(process.env.PORT) || 5050;
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET must be set");
app.listen(port, () =>
  console.log(`SkillBridge API listening on port ${port}`),
);
