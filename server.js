import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { getChatResponse } from './gemini.js';

async function startServer() {
  const app = express();

  // Use App Runner's PORT or fallback to 3000
  const PORT = process.env.PORT || 4000;

  // MongoDB Connection
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/enquiry_db";

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // stop app if DB fails
  }

  // Enquiry Schema
  const enquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  });

  const Enquiry = mongoose.model("Enquiry", enquirySchema);

  app.use(cors());
  app.use(express.json());

  // ── Enquiry Routes ──────────────────────────────────────────

  // Submit a new enquiry
  app.post("/api/enquiry", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      if (!name || !email || !phone || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const newEnquiry = new Enquiry({
        name,
        email,
        phone,
        subject,
        message,
      });

      await newEnquiry.save();
      res.status(201).json({
        message: "Enquiry submitted successfully",
        data: newEnquiry,
      });
    } catch (error) {
      console.error("Error saving enquiry:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all enquiries
  app.get("/api/enquiries", async (req, res) => {
    try {
      const enquiries = await Enquiry.find().sort({ createdAt: -1 });
      res.json(enquiries);
    } catch (error) {
      res.status(500).json({ error: "Error fetching enquiries" });
    }
  });

  // ── Chat Route ──────────────────────────────────────────────

  // Gemini chat — API key stays safely on the server
  app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await getChatResponse(message, history);
    res.json({ reply });
  });

  // ── Start Server ────────────────────────────────────────────
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();