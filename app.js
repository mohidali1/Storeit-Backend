const express = require("express"); // Import express
const app = express(); // Create an instance of express
const connectDB = require("./config/dbConfig");
const authRouter = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middlewares/errorHandlers");
const categoryRoutes = require("./routes/categoryRoutes");

connectDB();
app.use(express.json()); // To parse JSON request bodies

// Define a simple GET route
app.get("/", (req, res) => {
  res.send("Welcome to Express!");
});

app.use("/api/auth", authRouter);
app.use("/api", protectedRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

app.use(errorHandler);
// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
