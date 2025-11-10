import express from "express";
// we can do like this and also 
// import dotenv from "dotenv";
// dotenv.config();
// we can do this like 
import "dotenv/config";

const app = express();
const PORT = process.env.PORT

app.get("/api/auth/signup" ,(req,res)=>{
    res.send("SignUp Route");
});

app.get("/api/auth/login" ,(req,res)=>{
    res.send("login Route");
});

app.get("/api/auth/logout" ,(req,res)=>{
    res.send("logout Route");
});

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});