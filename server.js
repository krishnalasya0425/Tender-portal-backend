const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://palegoldenrod-ostrich-750270.hostingersite.com"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.options("*", cors());

app.use(express.json());

require("./utils/reminderJob");

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tenders", require("./routes/tenderRoutes"));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


