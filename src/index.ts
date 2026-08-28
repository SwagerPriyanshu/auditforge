/**
 * AuditForge — Entry Point
 *
 * Starts the Express server with all API routes.
 */

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createRouter } from "./api/routes";
import { getDb, closeDb } from "./storage/audit.db";
import { logger } from "./interception/logger";

// ─── Configuration ─────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const NODE_ENV = process.env.NODE_ENV ?? "development";

// ─── App Setup ─────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, _res, next) => {
  logger.debug("HTTP", `${req.method} ${req.path}`);
  next();
});

app.use("/api", createRouter());

app.get("/", (_req, res) => {
  res.json({
    name: "AuditForge",
    version: "0.1.0",
    description: "Verifiable incident investigation agent with cryptographic audit trails",
    endpoints: {
      health: "GET /api/health",
      sessions: "POST /api/sessions",
      listSessions: "GET /api/sessions",
      getSession: "GET /api/sessions/:id",
      auditLog: "GET /api/sessions/:id/audit",
      attestation: "GET /api/sessions/:id/attestation",
      approve: "POST /api/sessions/:id/approve",
      replay: "GET /api/sessions/:id/replay",
      investigate: "POST /api/sessions/:id/investigate",
    },
  });
});

// ─── Startup ───────────────────────────────────────────────────

async function start(): Promise<void> {
  logger.info("Startup", "Initializing audit database...");
  await getDb();

  app.listen(PORT, () => {
    logger.info("Startup", `AuditForge server running on port ${PORT}`, {
      environment: NODE_ENV,
      pid: process.pid,
    });

    console.log("");
    console.log("  🔍 AuditForge — Verifiable Incident Investigation Agent");
    console.log(`  📡 http://localhost:${PORT}`);
    console.log(`  📋 API: http://localhost:${PORT}/api`);
    console.log(`  💚 Health: http://localhost:${PORT}/api/health`);
    console.log("");
    console.log("  Built on TrueForge — the open-source agent harness");
    console.log("  https://github.com/truefoundry/trueforge");
    console.log("");
  });
}

function shutdown(): void {
  logger.info("Shutdown", "Shutting down AuditForge...");
  logger.shutdown();
  closeDb();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((err) => {
  console.error("Failed to start AuditForge:", err);
  process.exit(1);
});
