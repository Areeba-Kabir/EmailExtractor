const express = require("express");

const mongoose = require("mongoose");
require("dotenv").config();

const { connectDB } = require("../backend/config/dbconfig.js");

const app = express();

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

app.get("/", async (req, res) => {
  res.send("API getting");
});
