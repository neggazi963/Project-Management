import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import dns from "dns";
import routes from "./routes/index.route.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:5173"];

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // requests with no origin (curl, mobile apps, server-to-server)
  if (allowedOrigins.includes(origin)) return true;

  // allow any Vercel preview deployment for this project,
  // e.g. https://project-management-svmh-<hash>.vercel.app
  if (
    /^https:\/\/project-management-svmh(-[a-z0-9]+)?\.vercel\.app$/.test(origin)
  ) {
    return true;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.use(morgan("dev"));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Welcome to the backend",
  });
});

app.use("/api-v1", routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
