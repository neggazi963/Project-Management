import "dotenv/config";

import cors from "cors";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import morgan from "morgan";
import dns from "dns";
import routes from "./routes/index.route.js";
import { isAllowedOrigin } from "./libs/cors-origins.js";
import { initSocket } from "./libs/socket.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const server = http.createServer(app);

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

initSocket(server);

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

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
