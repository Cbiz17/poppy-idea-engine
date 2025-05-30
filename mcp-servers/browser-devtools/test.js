#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { WebSocketServer } from "ws";

console.error("Testing imports...");
console.error("Server:", typeof Server);
console.error("StdioServerTransport:", typeof StdioServerTransport);
console.error("WebSocketServer:", typeof WebSocketServer);
console.error("All imports successful!");
