require("dotenv").config();
const app = require("../Backend/src/app");
const connectDB = require("../Backend/src/config/db");

connectDB();
app.listen(3000, () => {
  console.log("Server is Running on port number 3000");
});
