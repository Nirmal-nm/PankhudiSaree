console.log("userAuth.js LOADED 🔥");

const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

console.log("userAuth.js loaded");

// ✅ SIGNUP API
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // 🛑 validation
    if (!name || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await db.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, phone, password) VALUES (?, ?, ?)",
      [name, phone, hashedPassword]
    );

    res.json({ message: "Signup successful" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ LOGIN API (FINAL)
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 🛑 validation
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required" });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // ✅ fallback secret (IMPORTANT FIX)
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || "rangmahal_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const { requireUserAuth } = require("../middleware/auth");

router.get("/profile", requireUserAuth, (req, res) => {
  res.json({
    message: "User profile 🔐",
    user: req.user
  });
});

module.exports = router;