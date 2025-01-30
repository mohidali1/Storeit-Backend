require("dotenv").config(); // This loads variables from .env

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI; // Retrieve the URI from environment variables
    if (!dbURI) {
      throw new Error("MONGO_URI is not defined in the environment variables.");
    }

    await mongoose.connect(dbURI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
