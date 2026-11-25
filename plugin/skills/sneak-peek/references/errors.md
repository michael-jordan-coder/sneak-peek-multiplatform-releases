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
| `legacy_project` | An older project with no folder to run. | `move_in` with `mode: "import"` and its folder. |
| `old_copy` | The project was made by an older Sneak Peek as a copy in its data folder, which this version no longer runs. | Tell the user to remove it from Home and bring the folder in again (`move_in` with `mode: "import"`); never edit the old copy. |
| `frame_not_found` | The frame is not on the canvas (removed, or a typo). | `look_around` for the frames that exist now. |
| `branch_not_found` | The id is not a branch of this project. | `look_around`: a frame's `workspaceId` names its branch. |
| `note_not_found` | The note is not open. | `look_around` for the open notes. |
| `app_not_open` | Sneak Peek's window is not open, so nothing can be photographed or focused. | Keep working in the folder; ask the user to open the project in Sneak Peek, then call again. |
| `pane_not_open` | An issue in `show_off` and `what_if`, not a failure: they put frames on a canvas that no browser pane shows, so the user does not see them beside the chat. It stays out once a pane shows the project's canvas. | Open `paneUrl` in your browser pane now; if you have none, tell the user the canvas is in the Sneak Peek app. |
| `app_closed` | An issue in `look_around`, not a failure: Sneak Peek is not running, so nothing is on screen and no dev server runs yet. | Go on. `move_in`, `show_off` and `what_if` start Sneak Peek's engine themselves, and the canvas then shows in a browser pane at their `paneUrl`. Only a photograph needs the window: ask the user to open Sneak Peek when you need one. |
| `supervisor_unavailable` | Sneak Peek's engine did not answer a tool that needs it. | Call `move_in`, which starts the engine, then call again. If that fails too, ask the user to open Sneak Peek. Do not start servers yourself. |
| `request_failed` | The app refused the request; the message says why (for example a frame or project that does not fit the request). | Fix the input and call again. |
| `action_required` | `show_off` was called with nothing to do. | Pass frames, an activity or notes. |
| `page_error` | A frame's page logged an error (inside `peek` results). | Read the message, fix it in the frame's folder, capture again. |
| `url_not_recognized` | `look_around` got an address no running frame serves (its dev server stopped, an address from an earlier run, or not a local page). | `look_around` without `url` and use `showing` (`frameId`, or `pointed`); start the frame's server with `poke_server` if it stopped, then try the address again. |
| `name_required` | `what_if` without `branch` needs `key` and `name`. | Pass both for a new direction, or `branch` to put a git branch on the canvas. |
| `workspace_in_use` | A conversation is in a turn in that folder. | Wait for it to finish, then call again. |

## Taking a direction back, and a fresh copy

| Code | What it means | What to do |
| --- | --- | --- |
| `choice_conflict` | `go_with`: the user's folder changed a file after the direction was made, and the direction changed it too (the message names the files). | Write the direction's change into that file in the user's folder by hand, keeping what is there, then call `go_with` again with `merged: true`. |
| `main_copy_changed` | `go_with`: switching the choice of a question would take back a direction whose files were edited in the user's folder since it came in (the message names them). | Keep the current choice and tell the user which files would be undone; `go_with` cannot switch over them. |
| `no_choice` | `whats_changed` with no `branchId` or `frameId`, and the user chose nothing. | Ask the user which direction to take and record it with `go_with`, or pass `branchId`. |
| `choice_ambiguous` | The user chose frames from more than one folder (the message names them). | Ask which one you mean, then pass its `branchId`. |
| `no_source` | A blank starter project has no source folder. | Nothing to refresh. |
| `source_missing` | The source folder is gone. | Ask the user where the project lives now. |

## Git branches on the canvas

| Code | What it means | What to do |
| --- | --- | --- |
| `invalid_branch` | `what_if` got a `branch` that is no branch name git accepts (it starts with `-`, has `..`, `@{`, blanks). | Pass the name as `look_around` lists it in `project.branches`. |
| `branch_checked_out` | The branch is open in another folder (the user's checkout or another worktree), and git opens a branch in one folder at a time. | Tell the user which folder (the message names it); they switch it to another branch, then ask again. |
| `remote_only` | The branch exists only on `origin`; putting it on the canvas creates a local branch of the same name in the user's repo. | Ask the user; they add it from the branch list, which asks them. |
| `branch_unknown` | The repo has no such branch (renamed, deleted, or a typo). Not `branch_not_found`, which is about a direction. | `look_around` for the branches the repo has now. |
| `no_source` | From `what_if` with `branch`: the project has no source folder (a blank canvas), so it has no git branches. | Make a direction with `what_if` without `branch`. |
| `not_git` | The project's source folder is no git repository. `look_around` then has no `branches` field and reports nothing. | Make a direction with `what_if` without `branch`; tell the user if they asked for a branch. |
| `git_missing` | git is not installed, or not on the PATH. | Tell the user that installing git lets Sneak Peek put branches on the canvas. |

## Sharing

| Code | What it means | What to do |
| --- | --- | --- |
| `needs_server` | The route needs a server to render. | It cannot be shared as static files; tell the user. |
| `missing_package` | A dependency is missing in the frame's folder. | Install it there (in the user's own folder, only after they agree), call again. |
| `build_failed` | The static build failed; the message has the output. | Say what blocks it and ask before changing the product's code; call again, at most twice. |
| `render_errors` | The built page logged errors. | Say what they are; fix them in the frame's folder when the user agrees, call again. |
| `unsupported_stack` | Not a Next.js (static export) or Vite project. | Tell the user; offer `mode: "local"` only if the stack allows it. |
| `not_installed`, `missing_tool`, `browser_unavailable` | Something the build needs is not on this computer. | Tell the user what the message names. |
| `not_signed_in` | The user is not signed in to Sneak Peek. | Ask them to sign in from the window, then call again. |
| `too_large` | Over 25 MB in all, 500 files, or 4 MB per file. | Reduce the build (images, fonts), call again. |
| `server_unreachable`, `upload_failed` | The share server did not take the upload. | Try once more; then tell the user. |
| `link_gone` | The link expired or was removed. | Call again to make a new one, and give the user the new address. |
| `pro_required` | The user's plan does not include this. | Relay the message as it is. Do not retry. |

In a design pull request ([design-pr.md](design-pr.md)) the live link is optional: when `pass_around` fails with any of these, open the PR without it and say why.
