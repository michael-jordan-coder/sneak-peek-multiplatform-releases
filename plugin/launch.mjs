#!/usr/bin/env node
// The public prototype-canvas plugin's MCP server, as Claude Code starts it at a session's start:
// it finds the installed Sneak Peek and runs the server that app ships, over stdio. Where the app
// is comes from `app-location.json` in the data folder, which the installed app writes on every
// start (electron/main.mjs recordLocation). Without an installed app it serves one tool that says
// so and where to get it, so the session hears why the canvas is missing instead of nothing.
//
// This file stands alone: the plugin folder is published apart from the app's code (the releases
// repo's plugin/), so it imports nothing but Node's own modules. Its rules mirror the engine's:
// the data folder is engine/projects/projects.mjs's, and the way an app's server is started is
// engine/agent/agent-plugin.mjs's (localServer).
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DOWNLOAD = "https://trysneakpeek.com/?from=plugin";

/** The engine's data folder (engine/projects/projects.mjs). */
export function dataFolder({ env = process.env, platform = process.platform, home = os.homedir() } = {}) {
  if (env.SNEAK_PEEK_DATA) return path.resolve(env.SNEAK_PEEK_DATA);
  const system = platform === "darwin" ? path.join(home, "Library", "Application Support")
    : platform === "win32" ? env.APPDATA ?? path.join(home, "AppData", "Roaming")
      : env.XDG_DATA_HOME ?? path.join(home, ".local", "share");
  return path.join(system, "Sneak Peek Multiplatform");
}

/**
 * How to start the server of the app `location` names, or null when that app is not there.
 * `location` is app-location.json: { executable, appImage, program, server }, `server` relative
 * to the folder of the program that runs it. Electron runs as Node with ELECTRON_RUN_AS_NODE.
 * An AppImage is mounted first (`mount: true`): its files are in a mount whose name changes on
 * every start, and its own AppRun adds --no-sandbox, which Electron as Node refuses, so the
 * program inside the mount is run directly (`program` and `server` are then within the mount).
 */
export function serverCommand(location, { exists = fs.existsSync } = {}) {
  if (!location || typeof location.executable !== "string" || typeof location.server !== "string") return null;
  if (!exists(location.executable)) return null;
  // The server records its tool calls as the public plugin's (engine/mcp-server/server.mjs client).
  const env = { ELECTRON_RUN_AS_NODE: "1", SNEAK_PEEK_MCP_CLIENT: "plugin" };
  if (location.appImage) {
    if (typeof location.program !== "string") return null;
    return { mount: true, appImage: location.executable, program: location.program, server: location.server, env };
  }
  const server = path.resolve(path.dirname(location.executable), location.server);
  return exists(server) ? { command: location.executable, args: [server], env } : null;
}

/** Mounts an AppImage (`--appimage-mount`, which keeps it mounted while it runs) and answers the mount's folder and the mounting process. */
function mountAppImage(appImage) {
  return new Promise((resolve, reject) => {
    const mounter = spawn(appImage, ["--appimage-mount"], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    mounter.on("error", reject);
    mounter.on("exit", () => reject(new Error("the AppImage did not mount")));
    mounter.stdout.on("data", (chunk) => {
      out += chunk;
      if (out.includes("\n")) resolve({ folder: out.split("\n")[0].trim(), mounter });
    });
    setTimeout(() => reject(new Error("the AppImage did not mount in 15 s")), 15_000).unref();
  });
}

function readLocation(folder) {
  try { return JSON.parse(fs.readFileSync(path.join(folder, "app-location.json"), "utf8")); } catch { return null; }
}

/**
 * A stdio MCP server with one tool, for a computer without the app: newline-delimited JSON-RPC,
 * as the MCP stdio transport has it. Every tool call answers where to get Sneak Peek.
 */
export function serveMissingApp({ input = process.stdin, output = process.stdout, folder = dataFolder() } = {}) {
  // A data folder without app-location.json is an app from before it wrote one (before 0.1.5),
  // or one not opened since it was installed: opening the latest version writes it.
  const message = fs.existsSync(folder)
    ? `Sneak Peek has not told this plugin where it is installed, so the prototype-canvas tools cannot run yet. Tell the user to update Sneak Peek to the latest version from ${DOWNLOAD} (or from its own update prompt), open it once, and start a new session.`
    : `Sneak Peek is not installed on this computer, so the prototype-canvas tools cannot run. Tell the user to download it from ${DOWNLOAD}, open it once, and start a new session.`;
  const send = (value) => output.write(JSON.stringify(value) + "\n");
  let buffer = "";
  input.setEncoding("utf8");
  input.on("data", (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line) continue;
      let request;
      try { request = JSON.parse(line); } catch { continue; }
      if (request.id === undefined) continue;
      if (request.method === "initialize") {
        send({ jsonrpc: "2.0", id: request.id, result: {
          protocolVersion: request.params?.protocolVersion ?? "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "prototype-canvas", version: "0.0.0" },
          instructions: message,
        } });
      } else if (request.method === "tools/list") {
        send({ jsonrpc: "2.0", id: request.id, result: { tools: [{
          name: "install_sneak_peek",
          description: `The Sneak Peek app, which the canvas runs in, cannot be reached. Call this to get what to tell the user. ${message}`,
          inputSchema: { type: "object", properties: {} },
        }] } });
      } else if (request.method === "tools/call") {
        send({ jsonrpc: "2.0", id: request.id, result: { content: [{ type: "text", text: message }], isError: true } });
      } else if (request.method === "ping") {
        send({ jsonrpc: "2.0", id: request.id, result: {} });
      } else {
        send({ jsonrpc: "2.0", id: request.id, error: { code: -32601, message: `${request.method} is not served: ${message}` } });
      }
    }
  });
}

/** Starts the app's server with this process's stdio, or the one that says the app is missing. */
export async function main() {
  let start = serverCommand(readLocation(dataFolder()));
  if (!start) return serveMissingApp();
  let mounter = null;
  if (start.mount) {
    try {
      const mounted = await mountAppImage(start.appImage);
      mounter = mounted.mounter;
      start = { command: path.join(mounted.folder, start.program), args: [path.join(mounted.folder, start.server)], env: start.env };
    } catch {
      return serveMissingApp();
    }
  }
  const child = spawn(start.command, start.args, { stdio: "inherit", env: { ...process.env, ...start.env } });
  const unmount = () => mounter?.kill();
  child.on("error", () => { unmount(); serveMissingApp(); });
  child.on("exit", (code, signal) => { unmount(); process.exit(signal ? 1 : code ?? 0); });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
