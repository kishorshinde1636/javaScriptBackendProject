//require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 9000, () => {
      console.log(`server in running at port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGO db connection failed !! ", error);
  });

//!another approach to connect db
/*
import mongoose from "mongoose";
import DB_NAME from "./constants";
import express from "express";
const app = express();

( async() => {
  try {
  await  mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("ERROR: ", error);
    throw error;
  }
})();
*/
