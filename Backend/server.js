import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Enable CORS with support for production CLIENT_URL (e.g. Vercel) while allowing localhost
const normalizedClientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim().replace(/\/+$/, "") : "";
const corsOptions = normalizedClientUrl
    ? { origin: [normalizedClientUrl, "http://localhost:5173", "http://localhost:3000"], credentials: true }
    : { origin: true, credentials: true };
app.use(cors(corsOptions));

// Health check endpoint for cloud monitoring and Render deployment
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api", chatRoutes);

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in the environment variables.");
    }
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected with Database!");
};

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`server running on ${PORT}`);
        });
    } catch(err) {
        console.error("Failed to connect with Db:", err.message || err);
        process.exit(1);
    }
};

startServer();


// app.post("/test", async (req, res) => {
//     const options = {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
//         },
//         body: JSON.stringify({
//             model: "gpt-4o-mini",
//             messages: [{
//                 role: "user",
//                 content: req.body.message
//             }]
//         })
//     };

//     try {
//         const response = await fetch("https://api.openai.com/v1/chat/completions", options);
//         const data = await response.json();
//         //console.log(data.choices[0].message.content); //reply
//         res.send(data.choices[0].message.content);
//     } catch(err) {
//         console.log(err);
//     }
// });
