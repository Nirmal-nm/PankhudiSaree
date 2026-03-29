const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

console.log("userAuth.js loaded");
// ✅ SIGNUP API
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // check if user exists
    const [existing] = await db.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
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

module.exports = router;