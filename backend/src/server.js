import express from "express";
// we can do like this and also 
// import dotenv from "dotenv";
// dotenv.config();
// we can do this like 
import "dotenv/config";

import authRoutes from "./routes/auth.routes.js";
import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});