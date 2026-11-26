require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => res.send("Marketplace API is running."));

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "OK", database: "connected" });
  } catch (err) {
    console.error("DB ERROR:", err.code, "-", err.message);
    res.status(500).json({ status: "ERROR", database: "disconnected", reason: err.code });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ message: err.message || "Request failed." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));