# Sneak Peek

Sneak Peek puts the UI of your own repo on a live canvas, so you and Claude can compare design directions side by side before anything changes in your code. Ask for "three directions for the header" and Claude makes each one in its own working copy of your project, running with your real dependencies, shows them as live frames on the canvas, and brings the one you choose back to your repo only as a diff you approve.

This plugin connects Claude Code, or Codex, to the Sneak Peek app. It adds the `sneak-peek` skill, which teaches Claude the way of working, and the `sneak-peek` MCP server, whose tools open your project, branch directions, show and photograph frames, and apply the one you choose.

## Install

In Claude Code:

```
/plugin install sneak-peek --marketplace michael-jordan-coder/sneak-peek-multiplatform-releases
```

In Codex:

```
codex plugin marketplace add michael-jordan-coder/sneak-peek-multiplatform-releases
codex plugin add sneak-peek@sneak-peek
```

Then reopen the ChatGPT desktop app and run the chat on your computer. Codex shows the canvas in a browser tab beside the chat.

## Requirements

- **The Sneak Peek app**, for Windows, Mac or Linux, free to download at [trysneakpeek.com](https://trysneakpeek.com/?from=plugin). Open it once after installing, so this plugin can find it.
- **Node.js** on your `PATH`, which runs the small launcher below.

## What this plugin runs

The plugin holds no service of its own. Its MCP server is `launch.mjs`, a short, readable Node script that:

1. Reads `app-location.json` in Sneak Peek's data folder (`~/Library/Application Support/Sneak Peek Multiplatform` on a Mac, `%APPDATA%\Sneak Peek Multiplatform` on Windows, `~/.local/share/Sneak Peek Multiplatform` on Linux), which the installed app writes each time it starts.
2. Starts the MCP server that ships inside that app, over stdio, on the app's own runtime. On Linux it mounts the app's AppImage for the length of the session and unmounts it at the end.
3. When no installed app is found, serves one tool, `install_sneak_peek`, which tells Claude where to download the app. Nothing else runs then.

The launcher reads only that one file, opens no network connection and sends nothing.

## What the Sneak Peek app does with your data

Your project's files stay on your computer: the app works on a copy of your repo in its data folder and writes to your repo only after you approve a diff. The app shares usage with its makers (what is used and what fails), and your chats with the agent in the app with pictures of the frames it makes, linked to your account when you sign in; Settings › Privacy turns each off. A share link uploads a static copy of a frame only when you share one.

## Tools

`look_around`, `read_me`, `move_in`, `show_off`, `peek`, `what_if`, `go_with`, `whats_changed`, `pass_around`, `poke_server` and `catch_up`. Each answers `{ ok, data, error }`, and an error says what to do next.

## Support

Questions and bugs: [trysneakpeek.com](https://trysneakpeek.com).
