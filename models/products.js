const mongoose = require("mongoose");
const User = require("./user"); // Replace with the correct path to your User model
const Category = require("./category"); // Replace with the correct path to your Category model
const mongoosePaginate = require("mongoose-paginate-v2");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [25, "Name must be less than 25 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [255, "Description must be less than 255 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be greater than or equal to 0"],
      validate: {
        validator: function (value) {
          return typeof value === "number" && !isNaN(value);
        },
        message: "Price must be a valid number",
      },
    },
    status: {
      type: String,
      default: "Active",
      enum: {
        values: ["Active", "Archived"],
        message: "Invalid status. Allowed values: Active, Archived",
      },
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to validate user and categories
ProductSchema.pre("save", async function (next) {
  try {
    // Validate user_id
    const userExists = await User.exists({ _id: this.user_id });
    if (!userExists) {
      throw new Error("Invalid user: User does not exist");
    }

    // Validate categories
    if (this.categories && this.categories.length > 0) {
      const validCategories = await Category.find({
        _id: { $in: this.categories },
      });
      if (validCategories.length !== this.categories.length) {
        throw new Error("One or more categories are invalid");
      }
    }

    next(); // Proceed with saving the document
  } catch (error) {
    next(error); // Pass the error to the next middleware
  }
});

ProductSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Product", ProductSchema);
