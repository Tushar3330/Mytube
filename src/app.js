import express from "express";
import cors  from "cors";
import cookieParser from "cookie-parser";

const app = express();

//cors  setup
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//setup to accept any type of data coming to the backend
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true , limit:"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());





export {app};