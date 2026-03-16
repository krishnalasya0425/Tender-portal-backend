const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(express.json());
app.get("/test", (req, res) => {
  res.json({ status: "ok Edgefo" });
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tenders", require("./routes/tenderRoutes"));

const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});



