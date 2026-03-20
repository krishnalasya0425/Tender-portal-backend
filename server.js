const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const tenderImportRoutes = require('./routes/tenderImport');

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json())
app.get("/test", (req, res) => {
  res.json({ status: "ok Edgefo" });
});
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tenders", require("./routes/tenderRoutes"));
app.use('/api/tenders/import', tenderImportRoutes);

const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});



