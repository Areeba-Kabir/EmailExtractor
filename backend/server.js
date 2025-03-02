

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const mondaySdk = require("monday-sdk-js");
const bodyParser = require("body-parser");
const { connectDB } = require("./config/dbconfig.js");
const router = require("./routes/wokOrderRoutes.js");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api", router);
app.use(cors());
app.use(bodyParser.json());

app.use("/uploads", express.static("uploads"));

const monday = mondaySdk();
monday.setToken(process.env.MONDAY_API_TOKEN);

app.get("/", async (req, res) => {
  res.send("API running with Monday.com integration");
});

app.get("/monday", async (req, res) => {
  try {
    const boards = await monday.api(`query { boards { id name } }`);
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Monday.com boards" });
  }
});

connectDB()
  .then(() => {
    console.log("Database connection success!");
    app.listen(process.env.PORT, () => {
      console.log(
        `API listening on PORT: http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((err) => console.log("Database connection failed", err));
