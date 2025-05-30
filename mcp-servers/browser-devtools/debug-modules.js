#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

console.log("Current directory:", process.cwd());
console.log("Script location:", __dirname);

try {
  const sdkPath = require.resolve('@modelcontextprotocol/sdk');
  console.log("MCP SDK found at:", sdkPath);
} catch (e) {
  console.error("MCP SDK not found:", e.message);
}

try {
  const puppeteerPath = require.resolve('puppeteer');
  console.log("Puppeteer found at:", puppeteerPath);
} catch (e) {
  console.error("Puppeteer not found:", e.message);
}

try {
  const wsPath = require.resolve('ws');
  console.log("WS found at:", wsPath);
} catch (e) {
  console.error("WS not found:", e.message);
}

// Check if local node_modules exists
import fs from 'fs';
const localModules = __dirname + '/node_modules';
console.log("\nChecking for local node_modules:", fs.existsSync(localModules) ? "EXISTS" : "NOT FOUND");
