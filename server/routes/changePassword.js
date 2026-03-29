const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const db = require("../db"); // your DB connection

router.post("/change-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE admins SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error updating password" });
  }
});

module.exports = router;