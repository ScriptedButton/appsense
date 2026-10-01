#!/usr/bin/env node
import { ensureHttpServer } from "./server.js";

const server = await ensureHttpServer();
if (!server) process.exit(1);
