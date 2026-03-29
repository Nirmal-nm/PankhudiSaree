console.log("userAuth.js LOADED 🔥");

const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

console.log("userAuth.js loaded");

// ✅ SIGNUP API
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ LOGIN API (ONLY ONCE)
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

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

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;