import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { assertValue } from "./common/assert";
import morgan from "morgan";
import Logger from "./common/logger";
import PatientRouter from "./router/patientRouter";
import admin from "firebase-admin";
import path from "path";
import { readFileSync } from "fs";
import { verifyTokenMiddleware } from "./middlewares/verifyTokenMiddleware";

dotenv.config({
  path: [".env.local", ".env"],
});

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const logger = Logger.getInstance({ name: "Index" });
const host: string = process.env.HOST || "localhost";
const port = Number(process.env.PORT || "4000");
const mongoUrl = assertValue(process.env.DATABASE_URL, "Missing database URL");
const app = express(); // Creates Express app

// Third-party Middlewares
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/**
 * Endpoints
 */
app.get("/health", (_, res) => {
  res.send("Server is running!");
});

app.use("/api/patients", verifyTokenMiddleware, PatientRouter);

/**
 * Connect to DB and start Server
 */
mongoose
  .connect(mongoUrl)
  .then(async () => {
    logger.info("MongoDB connected!");

    app.listen(port, host, () => {
      logger.info(`Server is running on port ${port}`);
    });

    // Seed the database
    // logger.info("Seeding database...");
    // await seedDatabase(100, process.env.PROVIDER_ID!);
  })
  .catch((error) => {
    logger.error(error, "MongoDB connection error:");
  });
