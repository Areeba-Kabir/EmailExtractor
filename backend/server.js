const express = require("express");

const mongoose = require("mongoose");
require("dotenv").config();

const { connectDB } = require("./config/dbconfig.js");
const router = require("./routes/wokOrderRoutes.js");
const app = express();
const cors = require("cors");

app.use(express.urlencoded({ extended: false }));
app.use("/api", router);

app.get("/", async (req, res) => {
  res.send("API getting");
});

connectDB()
  .then(() => {
    console.log("database connection success!");
    app.listen(process.env.PORT, () => {
      console.log(
        `API listening on PORT: http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch();
