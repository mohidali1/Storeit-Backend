const express = require("express");
const router = express.Router();
const Category = require("../models/category");
const protect = require("../middlewares/authMiddleware");

// Create a Category
router.post("/create", protect, async (req, res) => {
  const { name } = req.body;

  try {
    const category = new Category({ name });
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Handle unique constraint error
      res.status(400).json({ message: "Category already exists" });
    } else {
      res.status(500).json({ message: "Failed to create category" });
    }
  }
});

// Fetch All Categories
router.get("/", protect, async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

module.exports = router;
