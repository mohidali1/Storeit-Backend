const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const User = require("../models/user");

router.get("/profile", protect, async (req, res) => {
  try {
    // Access user information from the protected route
    const user = await User.findById(req.user.userId);
    res.json({ username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
