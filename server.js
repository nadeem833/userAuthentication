const express = require("express");
const morgan = require("morgan");
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

connectDb();
const app = express();

const port = process.env.PORT || 5000;
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/users", require("./routes/userRoutes"));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
