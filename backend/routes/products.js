const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${safeExt}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
      return cb(new Error("Only JPG, PNG or WEBP images are allowed."));
    cb(null, true);
  }
});

router.get("/", async (req, res) => {
  try {
    const { search = "", category = "", location = "" } = req.query;
    let sql = `SELECT p.*, u.name AS seller_name, u.phone AS seller_phone
               FROM products p JOIN users u ON p.user_id=u.id
               WHERE p.status='available'`;
    const values = [];
    if (search) { sql += " AND (p.title LIKE ? OR p.description LIKE ?)"; values.push(`%${search}%`, `%${search}%`); }
    if (category) { sql += " AND p.category=?"; values.push(category); }
    if (location) { sql += " AND p.location LIKE ?"; values.push(`%${location}%`); }
    sql += " ORDER BY p.created_at DESC";
    const [rows] = await db.execute(sql, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load products." });
  }
});

router.get("/mine", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE user_id=? ORDER BY created_at DESC", [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load your listings." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.name AS seller_name, u.phone AS seller_phone, u.email AS seller_email
       FROM products p JOIN users u ON p.user_id=u.id WHERE p.id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Product not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load product." });
  }
});

router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, price, category, location } = req.body;
    if (!title || !description || !price || !category || !location)
      return res.status(400).json({ message: "Please fill all required fields." });
    if (Number(price) <= 0 || Number.isNaN(Number(price)))
      return res.status(400).json({ message: "Enter a valid price." });

    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await db.execute(
      `INSERT INTO products (user_id,title,description,price,category,location,image)
       VALUES (?,?,?,?,?,?,?)`,
      [req.user.id, title.trim(), description.trim(), Number(price), category, location.trim(), image]
    );
    res.status(201).json({ message: "Product listed successfully.", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Could not create listing." });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM products WHERE id=? AND user_id=?", [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Listing not found." });
    res.json({ message: "Listing deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete listing." });
  }
});

module.exports = router;
