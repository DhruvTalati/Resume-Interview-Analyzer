require("dotenv").config();
const app = require("../Backend/src/app");
const connectDB = require("../Backend/src/config/db");
const invokeGeminiAi = require("./src/services/ai.service");

connectDB();
invokeGeminiAi();

app.listen(3000, () => {
  console.log("Server is Running on port number 3000");
});
