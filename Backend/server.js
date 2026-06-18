require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const generateInterviewReport = require("./src/services/ai.service");

const {
  resume,
  selfDescription,
  jobDescription,
} = require("./src//services/temp");

connectDB();

generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});