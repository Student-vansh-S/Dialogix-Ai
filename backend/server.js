import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use("/api",chatRoutes);
// app.post("/test", async (req, res) => {
//     try {
//         const { message } = req.body;

//         if (!message) {
//             return res.status(400).json({ error: "Message is required" });
//         }

//         const options = {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 contents: [
//                     {
//                         parts: [
//                             {
//                                 text: message, 
//                             },
//                         ],
//                     },
//                 ],
//             }),
//         };

//         const response = await fetch(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
//             options
//         );

//         const data = await response.json();
//         console.log(data.candidates[0].content.parts[0].text);
//         res.send(data);
//     } catch (e) {
//         console.error("Error:", e);
//         res.status(500).json({ error: "Something went wrong" });
//     }
// });

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
    connectDB();
});

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to Database");
    }catch(err){
        console.log("Failed to connect with DB",err);
    }
}