const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const protect = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ username, email, password });
    await user.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No User Found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// In case of admin add a specific
router.post("/create-user", protect, checkRole(["admin"]), async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const allowedRoles = ["admin", "seller", "customer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    res
      .status(201)
      .json({ message: "User created successfully by admin", user });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

// To update user role
router.put(
  "/update-role/:id",
  protect,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { role } = req.body;

      const validRoles = ["admin", "seller", "customer"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role provided" });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (req.user.userId === user.id) {
        return res
          .status(403)
          .json({ message: "You cannot change your own role" });
      }

      user.role = role;
      await user.save();

      res.json({ message: `User role updated to ${role}`, user });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
