# When a tool fails

Every error is `{ code, message, next }`. `next` is the step to take; this table adds the reasoning.

| Code | What it means | What to do |
| --- | --- | --- |
| `project_required` | No project is open, and nothing says which folder you work in (no MCP roots, no `repoPath`). | Working in the user's repo: pass `repoPath`, or `move_in` with `mode: "import"` and the repo's root (it reuses an existing import). Otherwise `look_around` with `includeProjects: true`, then pass a `projectId`. |
| `project_not_found` | The id names no project. | `look_around` with `includeProjects: true`. |
| `repo_not_imported` | The folder you work in (your MCP roots, or `repoPath`) has no project yet, so a tool without `projectId` has nothing to work on. In `look_around`, an issue. | `move_in` with `mode: "import"` and `sourcePath` set to the repo's root, then call again. To work on another project, pass its `projectId`. |
| `repo_unknown` | An issue in `look_around`: your client sent no MCP roots (or did not answer for them) and you passed no `repoPath`, or the folder you work in is no code repo (the home folder, say; `repo.notRepo`), so look_around answered with the canvas on screen, which may be another repo's. | Pass `repoPath`, the folder you work in, to `look_around` and the other tools. |
| `other_project_on_screen` | An issue in `look_around`: the window shows another project than your repo's. | Keep working on your repo's project (tools without `projectId` do). If the user means the one on screen, pass its `projectId`. |
| `parent_project_required` | The id is a branch. | Pass the parent project; reach the branch through its frame's `workspaceId`. |
| `legacy_project` | An older project without a working copy. | `move_in` with `mode: "import"` and its folder. |
| `frame_not_found` | The frame is not on the canvas (removed, or a typo). | `look_around` for the frames that exist now. |
| `branch_not_found` | The id is not a branch of this project. | `look_around`: a frame's `workspaceId` names its branch. |
| `note_not_found` | The note is not open. | `look_around` for the open notes. |
| `app_not_open` | Sneak Peek's window is not open, so nothing can be photographed or focused. | Keep working in the working copy; ask the user to open the project in Sneak Peek, then call again. |
| `pane_not_open` | An issue in `show_off` and `what_if`, not a failure: they put frames on a canvas that no browser pane shows, so the user does not see them beside the chat. It stays out once a pane shows the project's canvas. | Open `paneUrl` in your browser pane now; if you have none, tell the user the canvas is in the Sneak Peek app. |
| `app_closed` | An issue in `look_around`, not a failure: Sneak Peek is not running, so nothing is on screen and no dev server runs yet. | Go on. `move_in`, `show_off` and `what_if` start Sneak Peek's engine themselves, and the canvas then shows in a browser pane at their `paneUrl`. Only a photograph needs the window: ask the user to open Sneak Peek when you need one. |
| `supervisor_unavailable` | Sneak Peek's engine did not answer a tool that needs it. | Call `move_in`, which starts the engine, then call again. If that fails too, ask the user to open Sneak Peek. Do not start servers yourself. |
| `request_failed` | The app refused the request; the message says why (for example a frame or project that does not fit the request). | Fix the input and call again. |
| `action_required` | `show_off` was called with nothing to do. | Pass frames, an activity or notes. |
| `page_error` | A frame's page logged an error (inside `peek` results). | Read the message, fix the working copy, capture again. |
| `url_not_recognized` | `look_around` got an address no running working copy serves (its dev server stopped, an address from an earlier run, or not a local page). | `look_around` without `url` and use `showing` (`frameId`, or `pointed`); start the frame's server with `poke_server` if it stopped, then try the address again. |
| `workspace_in_use` | A conversation is in a turn in that working copy. | Wait for it to finish, then call again. |

## Taking a direction back, and a fresh copy

| Code | What it means | What to do |
| --- | --- | --- |
| `choice_conflict` | `go_with`: the main working copy changed a file after the direction was branched, and the direction changed it too (the message names the file). | Write the direction's change into that file in the main working copy by hand, keeping what is there, then call `go_with` again with `merged: true`. |
| `main_copy_changed` | `go_with`: switching the choice of a question would take back a direction whose files were edited in the main working copy since it came in (the message names them). | Keep the current choice and tell the user which files would be undone; `go_with` cannot switch over them. |
| `no_choice` | `whats_changed` with no `branchId` or `frameId`, and the user chose nothing. | Ask the user which direction to take and record it with `go_with`, or pass `branchId`. |
| `choice_ambiguous` | The user chose frames from more than one working copy (the message names them). | Ask which one to take back, then pass its `branchId`. |
| `unsynced_changes` | `catch_up` would overwrite changes in the copy that never went back to the source (the message names them). | Ask the user. Keep them: `whats_changed` with the project's id, apply after their yes, then refresh. Discard them: `force: true` (a checkpoint keeps them). |
| `source_changed` | A warning in `what_if`'s `issues`: the user's repo changed since the working copy last matched it, so the new direction starts from older files. | Tell the user; offer `catch_up`, then branch again. |
| `no_source` | A blank starter project has no source folder. | Nothing to refresh. |
| `source_missing` | The source folder is gone. | Ask the user where the project lives now. |

## Sharing

| Code | What it means | What to do |
| --- | --- | --- |
| `needs_server` | The route needs a server to render. | It cannot be shared as static files; tell the user. |
| `missing_package` | A dependency is missing in the working copy. | Install it there, call again. |
| `build_failed` | The static build failed; the message has the output. | Fix the working copy (never the source), call again, at most twice. |
| `render_errors` | The built page logged errors. | Fix them in the working copy, call again. |
| `unsupported_stack` | Not a Next.js (static export) or Vite project. | Tell the user; offer `mode: "local"` only if the stack allows it. |
| `not_installed`, `missing_tool`, `browser_unavailable` | Something the build needs is not on this computer. | Tell the user what the message names. |
| `not_signed_in` | The user is not signed in to Sneak Peek. | Ask them to sign in from the window, then call again. |
| `too_large` | Over 25 MB in all, 500 files, or 4 MB per file. | Reduce the build (images, fonts), call again. |
| `server_unreachable`, `upload_failed` | The share server did not take the upload. | Try once more; then tell the user. |
| `link_gone` | The link expired or was removed. | Call again to make a new one, and give the user the new address. |
| `pro_required` | The user's plan does not include this. | Relay the message as it is. Do not retry. |
