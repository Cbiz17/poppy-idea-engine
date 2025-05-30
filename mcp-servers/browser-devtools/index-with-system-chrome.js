#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import puppeteer from "puppeteer";
import { WebSocketServer } from "ws";

// Use system Chrome if available
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

function findChrome() {
  const fs = require('fs');
  for (const path of CHROME_PATHS) {
    try {
      if (fs.existsSync(path)) {
        return path;
      }
    } catch (e) {}
  }
  return null;
}

class BrowserDevToolsServer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.wsServer = null;
    this.consoleMessages = [];
    this.networkRequests = [];
    this.errors = [];
    
    this.server = new Server(
      {
        name: "browser-devtools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.startWebSocketServer();
  }

  startWebSocketServer() {
    // WebSocket server for real-time communication with browser
    this.wsServer = new WebSocketServer({ port: 8765 });
    
    this.wsServer.on("connection", (ws) => {
      console.error("Browser connected to DevTools MCP");
      
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case "console":
              this.consoleMessages.push({
                timestamp: new Date().toISOString(),
                ...data.payload,
              });
              break;
            case "network":
              this.networkRequests.push({
                timestamp: new Date().toISOString(),
                ...data.payload,
              });
              break;
            case "error":
              this.errors.push({
                timestamp: new Date().toISOString(),
                ...data.payload,
              });
              break;
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });
    });
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_console_logs",
          description: "Get console logs from the browser",
          inputSchema: {
            type: "object",
            properties: {
              level: {
                type: "string",
                enum: ["all", "log", "warn", "error", "debug"],
                default: "all",
              },
              limit: {
                type: "number",
                default: 50,
              },
            },
          },
        },
        {
          name: "get_network_requests",
          description: "Get network requests from the browser",
          inputSchema: {
            type: "object",
            properties: {
              filter: {
                type: "string",
                enum: ["all", "failed", "slow", "api"],
                default: "all",
              },
              limit: {
                type: "number",
                default: 50,
              },
            },
          },
        },
        {
          name: "get_page_errors",
          description: "Get JavaScript errors from the page",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                default: 20,
              },
            },
          },
        },
        {
          name: "execute_script",
          description: "Execute JavaScript in the browser context",
          inputSchema: {
            type: "object",
            properties: {
              script: {
                type: "string",
                description: "JavaScript code to execute",
              },
            },
            required: ["script"],
          },
        },
        {
          name: "take_screenshot",
          description: "Take a screenshot of the current page",
          inputSchema: {
            type: "object",
            properties: {
              fullPage: {
                type: "boolean",
                default: false,
              },
            },
          },
        },
        {
          name: "get_performance_metrics",
          description: "Get performance metrics from the browser",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "clear_browser_data",
          description: "Clear browser storage (localStorage, sessionStorage, cookies)",
          inputSchema: {
            type: "object",
            properties: {
              types: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["localStorage", "sessionStorage", "cookies", "cache"],
                },
                default: ["localStorage", "sessionStorage"],
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_console_logs":
            return this.getConsoleLogs(args);
          
          case "get_network_requests":
            return this.getNetworkRequests(args);
          
          case "get_page_errors":
            return this.getPageErrors(args);
          
          case "execute_script":
            return this.executeScript(args);
          
          case "take_screenshot":
            return this.takeScreenshot(args);
          
          case "get_performance_metrics":
            return this.getPerformanceMetrics();
          
          case "clear_browser_data":
            return this.clearBrowserData(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async ensureBrowser() {
    if (!this.browser) {
      const launchOptions = {
        headless: false,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      };

      // Try to use system Chrome if Puppeteer's Chrome isn't available
      const systemChrome = findChrome();
      if (systemChrome) {
        launchOptions.executablePath = systemChrome;
      }

      try {
        this.browser = await puppeteer.launch(launchOptions);
      } catch (error) {
        console.error("Failed to launch browser:", error);
        // Try without executable path
        delete launchOptions.executablePath;
        this.browser = await puppeteer.launch(launchOptions);
      }
      
      const pages = await this.browser.pages();
      this.page = pages[0] || await this.browser.newPage();
      
      // Inject DevTools script
      await this.page.evaluateOnNewDocument(() => {
        // Connect to MCP WebSocket server
        const ws = new WebSocket("ws://localhost:8765");
        
        // Intercept console methods
        const originalConsole = { ...console };
        ["log", "warn", "error", "debug", "info"].forEach((method) => {
          console[method] = (...args) => {
            originalConsole[method](...args);
            
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "console",
                payload: {
                  level: method,
                  message: args.map(arg => 
                    typeof arg === "object" ? JSON.stringify(arg) : String(arg)
                  ).join(" "),
                  args: args,
                },
              }));
            }
          };
        });
        
        // Intercept errors
        window.addEventListener("error", (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "error",
              payload: {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
              },
            }));
          }
        });
        
        // Intercept network requests
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "resource") {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: "network",
                  payload: {
                    name: entry.name,
                    duration: entry.duration,
                    size: entry.transferSize,
                    type: entry.initiatorType,
                  },
                }));
              }
            }
          }
        });
        observer.observe({ entryTypes: ["resource"] });
      });
    }
  }

  async getConsoleLogs(args) {
    const { level = "all", limit = 50 } = args;
    
    let logs = this.consoleMessages;
    if (level !== "all") {
      logs = logs.filter((log) => log.level === level);
    }
    
    logs = logs.slice(-limit);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(logs, null, 2),
        },
      ],
    };
  }

  async getNetworkRequests(args) {
    const { filter = "all", limit = 50 } = args;
    
    let requests = this.networkRequests;
    
    switch (filter) {
      case "failed":
        requests = requests.filter((req) => req.status >= 400);
        break;
      case "slow":
        requests = requests.filter((req) => req.duration > 1000);
        break;
      case "api":
        requests = requests.filter((req) => req.name.includes("/api/"));
        break;
    }
    
    requests = requests.slice(-limit);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(requests, null, 2),
        },
      ],
    };
  }

  async getPageErrors(args) {
    const { limit = 20 } = args;
    const errors = this.errors.slice(-limit);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(errors, null, 2),
        },
      ],
    };
  }

  async executeScript(args) {
    await this.ensureBrowser();
    
    const result = await this.page.evaluate((script) => {
      try {
        return eval(script);
      } catch (error) {
        return { error: error.message };
      }
    }, args.script);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async takeScreenshot(args) {
    await this.ensureBrowser();
    
    const screenshot = await this.page.screenshot({
      fullPage: args.fullPage || false,
      encoding: "base64",
    });
    
    return {
      content: [
        {
          type: "text",
          text: `Screenshot taken successfully. Base64 length: ${screenshot.length}`,
        },
      ],
    };
  }

  async getPerformanceMetrics() {
    await this.ensureBrowser();
    
    const metrics = await this.page.metrics();
    const performanceTiming = await this.page.evaluate(() =>
      JSON.stringify(window.performance.timing)
    );
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            metrics,
            timing: JSON.parse(performanceTiming),
          }, null, 2),
        },
      ],
    };
  }

  async clearBrowserData(args) {
    await this.ensureBrowser();
    
    const { types = ["localStorage", "sessionStorage"] } = args;
    
    for (const type of types) {
      switch (type) {
        case "localStorage":
          await this.page.evaluate(() => localStorage.clear());
          break;
        case "sessionStorage":
          await this.page.evaluate(() => sessionStorage.clear());
          break;
        case "cookies":
          const cookies = await this.page.cookies();
          await this.page.deleteCookie(...cookies);
          break;
        case "cache":
          const client = await this.page.target().createCDPSession();
          await client.send("Network.clearBrowserCache");
          break;
      }
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Cleared: ${types.join(", ")}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Browser DevTools MCP Server running on stdio");
  }
}

const server = new BrowserDevToolsServer();
server.run().catch(console.error);
