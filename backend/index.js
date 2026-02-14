import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import path from "path";

dotenv.config();
const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const __dirname = path.resolve();

app.use(cors({
    origin: import.meta.env.NODE_ENV === "production" ? "https://mern-auth-p2j9.onrender.com" : "http://localhost:5173", // Only allow requests from this origin
    credentials: true
}));
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser()); // Middleware to parse cookies

app.use("/api/auth", authRoutes);
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}



app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});