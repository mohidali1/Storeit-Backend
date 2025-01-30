const express = require("express");
const router = express.Router();
const Product = require("../models/products");
const protect = require("../middlewares/authMiddleware");
const Category = require("../models/category");
const { body, validationResult } = require("express-validator");
const checkRole = require("../middlewares/roleMiddleware");

const validateProduct = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 25 })
    .withMessage("Name must be less than 25 characters"),
  body("description")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Description must be less than 255 characters"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a valid number")
    .custom((value) => value >= 0)
    .withMessage("Price must be greater than or equal to 0"),
  body("status")
    .optional()
    .isIn(["Active", "Archived"])
    .withMessage("Invalid status."),
  body("categories")
    .isArray()
    .withMessage("Categories must be an array of valid category IDs"),
];

// To create a new Product
// Only admin and seller are allowed
router.post(
  "/store",
  protect,
  checkRole(["admin", "seller"]),
  validateProduct,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors
          .array()
          .map((e) => ({ field: e?.path, message: e?.msg })),
      });
    }

    const { name, description, price, categories, status } = req.body;

    try {
      // Resolve category names to ObjectIds if necessary
      const validCategories = await Category.find({
        _id: { $in: categories },
      });

      if (validCategories.length !== categories.length) {
        return res
          .status(400)
          .json({ message: "One or more categories are invalid" });
      }

      const product = new Product({
        name,
        description,
        price,
        user_id: req.user.userId,
        categories: validCategories.map((cat) => cat._id), // Save as ObjectIds
        status,
      });

      const savedProduct = await product.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create Product" });
    }
  }
);

// To get a listing of Products
router.get("/index", protect, async (req, res) => {
  //Without Pagination
  // try {
  //   const products = await Product.find()
  //     .populate("user_id", "username email")
  //     .populate("categories", "name");
  //   res.status(200).json(products);
  // } catch (error) {
  //   console.log(error);
  //   res.status(500).json({ message: "Failed to fetch products" });
  // }

  //With Pagination

  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      search,
    } = req.query;

    const query = {};
    if (search) {
      query.name = new RegExp(search, "i");
    }

    const sortOptions = { [sort]: order === "asc" ? 1 : -1 };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: "user_id", select: "username email" },
        { path: "categories", select: "name" },
      ],
    };

    const products = await Product.paginate(query, options);

    res.json({
      data: products.docs,
      total: products.totalDocs,
      page: products.page,
      totalPages: products.totalPages,
      hasNextPage: products.hasNextPage,
      hasPrevPage: products.hasPrevPage,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});

// To update a product information
// Only admin and seller with its own products are allowed
router.put(
  "/update/:id",
  protect,
  checkRole(["admin", "seller"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, categories, status } = req.body;

      if (categories) {
        const validCategories = await Category.find({
          _id: { $in: categories },
        });
        if (validCategories.length !== categories.length) {
          return res
            .status(400)
            .json({ message: "One or more categories are invalid" });
        }
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Sellers can only modify their own products
      if (
        req.user.role === "seller" &&
        product.user_id.toString() !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ message: "You can only update your own products" });
      }

      const updateProduct = await Product.findByIdAndUpdate(
        id,
        {
          name,
          description,
          price,
          categories,
          status,
        },
        { new: true, runValidators: true }
      );

      if (!updateProduct) {
        res.status(404).json({ message: "Product not found" });
      }
      return res
        .status(200)
        .json({ data: updateProduct, message: "Product updated succesfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  }
);

// To delete a Product
// Only admin and seller with its own products are allowed

router.delete(
  "/delete/:id",
  protect,
  checkRole(["admin", "seller"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Sellers can only delete their own products
      if (
        req.user.role === "seller" &&
        product.user_id.toString() !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ message: "You can only delete your own products" });
      }

      const deleteProduct = await Product.findByIdAndDelete(id);
      if (!deleteProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  }
);

module.exports = router;
