import dotenv from "dotenv";
import connectDB from "./db/dbconnect.js";

dotenv.config({ path: './.env' });
import express from "express";
const app = express();


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });
