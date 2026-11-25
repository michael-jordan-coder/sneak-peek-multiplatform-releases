# The sneak-peek tools

Every tool that works on a project takes an optional `projectId`. Without one, it works on the project the session was opened from (a session the app started), else on the project imported from the folder you work in, else, only when nothing says where you work, on the canvas the user has open. The server learns your folder from your client's MCP roots (Claude Code sends them; it asks once per session, or with each call on the newer protocol). A client without roots passes `repoPath`, the folder it works in, to `look_around` and to the other tools. When that folder has no project yet, the tools say so (`repo_not_imported`) instead of working on another project's canvas. Every result is `{ ok, data, error }`; an error has a `code`, a `message` and `next`, what to do about it.

## look_around

Read-only. Returns:

- `paneUrl`: the project's canvas as a page, as `show_frames` returns it below; open it beside the chat when the user asks to see the canvas. Null with no project, or while Sneak Peek's engine is not running (`look` starts nothing).
- `pages`: the canvas's pages, `[{ id, name }]`. Screens (`screens`) is first and always there: the app's routes. Other pages hold other work, each arranged on its own. Every frame names its `page`, and `showing.page` is the page the user is on.

- `repo`: the folder you work in, as `{ path, projectId, via }`. `via` is `roots` (your client's MCP roots), `repoPath` (you passed it) or `cwd` (a server started over stdio in your folder). `projectId` is the project imported from it, the one look_around answers about; null means the repo has no project yet, `project` is null too, and `issues` has `repo_not_imported`: call `move_in` with `mode: "import"` and `sourcePath` set to the repo's root. `repo` is null when nothing says where you work (`issues` then has `repo_unknown`: pass `repoPath`).
- `onScreen`: the project the Sneak Peek window shows now. When it is not your repo's project, `issues` has `other_project_on_screen`; tools without `projectId` still work on your repo's project.
- `issues`: what look_around noticed about where you work, each `{ code, message, next }`. `app_closed` means Sneak Peek is not running: the tools still work, and the ones that change the canvas start its engine.
- `app.running` and `app.windowOpen`: whether Sneak Peek is running, and whether its window is open. `app.version` is the app's version, worth quoting when something does not behave as described here. Without the window, frames cannot be photographed or focused, but you can still edit and report.
- `project`: `id`, `sourcePath` (the user's folder, which the main frame runs and you edit) and `blank` (a starter app in Sneak Peek's data folder, a git repo of its own). `branch` is the git branch checked out in the user's folder (null without git). While Sneak Peek's engine runs, `source` is `{ branch, commit, moved }` and `branches` lists the repo's branches, each `{ name, remote, current, onCanvas, workspaceId, frameId, commit, behind, changed }`: `onCanvas` with the frame that shows it (a worktree on the branch itself, so `behind` is 0), `changed` whether that worktree has uncommitted changes. A remote branch with no local one is named `origin/<name>`. No git repo: no `branches` field.
- `workspace.path`: the folder to edit: the user's own folder for the main frame, a git worktree for a direction or branch frame.
- `devServer`: `state` (`running`, `installing`, `starting`, `stopped`, `idle`, `error`, `unknown`), `url`, and the last `output`.
- `frames`: each with `id`, `workspaceId` (the project for the main frame, or a direction's or branch frame's own), `route`, `name`, position, size, `round` (a direction's round in its row, null for the main frame's) and `branch`, the git branch the frame shows: a branch frame's own branch, the main frame's `project.branch`, or null for a direction you made.
- `rounds`: per row (route), its rounds of directions oldest first, each `{ id, number, startedAt, frameIds, latest }`. The canvas stacks a row's rounds downwards, the newest at the bottom, with a line and "number · time" above each round after the first, so you can say "round 2" and the user finds it.
- `showing`: what the user sees. `onCanvas` is false when they are on Home or on another project. Otherwise `frameId`, `frameName`, `route`, `fullScreen`, `device` (`fill`, `iphone`, `ipad`, `macbook`) and `element`, the element the user picked with Inspect: `element.element` has `tag`, `text`, `className`, `selector` (a short CSS path) and `rect`; `element.chain[0].source` is the file, line and column that wrote it (an absolute path in that frame's folder), and the rest of `chain` names the components that rendered it, innermost first, each with the line that wrote it. Edit that line, not a lookalike elsewhere. `summary` says the same in a sentence.
  `pointed` is the frame the user last pointed at in the side pane's canvas (`frameId`, `at`), or null: an element picked with the browser pane's own Inspect carries no page address, so this is the frame it belongs to.
- `notes`: notes the user left on frames, with their ids. A note with no `element` is on the whole frame (`variant` is the frame's id). A note with `visitor` is a comment from someone the user shared a link with (`from.link`), not the user's: `visitor` says how to treat it. Notes the user kept from the agent are not listed.
- `chosen`: the frames the user chose, one per question at most (`frameId`, `workspaceId`, `route`, `name`, `chosenAt`, `inMainCopy`). A question is one round of directions of a route; the main frame is a question of its own, and other rounds keep their choices. Choosing a direction's frame brings its changes into the user's folder as uncommitted changes (`inMainCopy` true, as it is for the main frame itself); choosing another frame of the same question takes its files back out first, and clearing the choice takes them out. A choice made before the canvas did this has `inMainCopy` false.
- `projects`: every project, when called with `includeProjects: true`, each with `sourcePath` (the folder it was imported from, null for a blank one), `branch` and `branchOf` (a branch's parent project; pass the parent's id, not the branch's).

`repoPath`: the folder you work in, when your client sends no MCP roots. The other tools take it too, for their default project.

`url`: a page address as the browser shows it (`http://127.0.0.1:57868/en/about`), or only its origin (an image's `src` carries one). `page` then says which project, folder (`workspaceId`, `branch`) and frame (`frameId`) it is, and how sure: `match` is `exact` (a frame shows that route), `pointed` (the frame the user pointed at shows that folder), `only_frame`, `prefix` (the frame whose route the path continues) or `workspace` (the frame is unknown; `candidates` lists that folder's frames). `workspace` and `devServer` are that folder's, so `workspace.path` is the folder to edit for that page. An address no running frame serves fails with `url_not_recognized`.

## read_me

Read-only. Returns this skill's text for a client that does not load skills itself: `section` is `guide` (the way of working, the default), `tools` (this page) or `errors`. Call it once at the start of a session when `sneak-peek` is not among your skills.

## move_in

`mode`: `existing` (with `projectId`), `import` (with `sourcePath`, the user's folder, and optionally `name`), or `blank` (a starter app in Sneak Peek's data folder, a git repo of its own). Importing runs the folder itself, in place; nothing is copied. A folder outside git is refused with `not_git`. Importing the same folder again reuses its project. `devServer`: `start` (default), `restart` or `leave`. Returns the `workspace`, `firstFrameId`, the dev server's state and `paneUrl`, the address that shows this project's canvas in a browser pane (open it there when you have one); `issues` lists what did not work without failing the call.

## show_off

`frames`: a list of `{ id, route?, name?, width?, height?, workspaceId?, page? }`. An id that exists is updated in place and keeps the fields you omit; a new frame is 1440 by 900 unless you give a size. The canvas arranges the frames itself: columns by route depth (the root screen, then top-level screens, then what is under them), a row per route, a branch's frame to the right of its source. `x` and `y` are accepted and ignored. `route` starts with `/`. `workspaceId` points a frame at a direction or branch frame; omit it for the main frame. Up to 100 frames per canvas.

`page`: `{ id, name? }`, the page the frames in this call go on, unless a frame names its own `page`. A page the canvas lacks is added, named `name` (else its id). Without either, a new frame goes on Screens and an existing one stays on its page. Each page is arranged on its own.

`focus`: `new` (default) moves the canvas to the frames you just added, `all` to every frame in the call, `none` leaves the view alone. The result's `focus` is `moved` (the window, or a canvas open in a browser pane, moved), `window_closed` (saved, but nothing to move) or `failed`.

`paneUrl`: the address that shows this project's canvas in a browser pane. When you have one (Claude Desktop's Browser pane, or in Codex a browser tab opened with `codex_app`'s `open_in_codex`, `placement: "right"`, `target: { type: "browser", url }`), open it there after showing frames; the canvas then follows each later `show_off` by itself. While no pane shows this project's canvas, a call that puts frames on it reports `pane_not_open` in `issues`; it stops once the pane is open. A double-click on a frame there opens its own page, where the pane's Inspect, Reload and sizes work on it; Back returns to the canvas.

`activity`: `{ state: "working" | "idle", message? }` marks the frames in the call: while working they glow on the canvas. Working again without frames keeps the frames marked before; idle ends the glow.

`resolvedNoteIds`: notes you handled, by id from `look_around`.

`pictures`: a picture of each frame you put or changed (up to four), as the window renders it now, with `state`, `errors` and `imageIndex` as in `peek`. Empty when the window is closed. `capture: false` skips it, for a frame whose dev server is still starting.

## peek

Read-only. `frameIds` defaults to the frame the user is looking at. Each frame comes back with `state` (`rendered`, `error` when the page logged errors, `navigated` when the page left its route, `unavailable`), `errors`, `location`, and `imageIndex`, the position of its picture among the images in the result. Needs the window open; the picture is the page at the frame's size, rendered fresh.

`steps`: run in the page before the picture, in order, with real input, so you see what happens when the page is used, not only how it rests. Each is one of `{ hover }`, `{ click }`, `{ type, into? }`, `{ press }` (Escape, Enter, Tab, ArrowDown, Backspace, or a character), `{ scroll: { x?, y?, target? } }`, `{ wait }` (ms, up to 5000) or `{ shot: true }` (a picture at that point). A target is a CSS selector (`#id`, `.class`, `[name=q]`) or the words on the element (a button's label, a placeholder, a heading); the innermost interactive element with those words wins. Example: `[{ hover: "Count is 0" }, { shot: true }, { click: "Count is 0" }, { press: "Escape" }]`. Each step comes back with `found`, `hit` (what it landed on, like `button "Count is 0"`), `instead` (what the page offers when nothing matched) and `imageIndex` for a `shot`. The final picture is the page as it ended.

The pictures come back in the result only: `peek` writes no file and returns no boxes for the elements a change touched. A design pull request needs both; [design-pr.md](design-pr.md) says how to get them from the frame's own page until `peek` can.

## what_if

`key`: your stable name for the direction (letters, digits, `_`, `-`). `name`: what the user sees. `sourceFrameId` defaults to the frame the user is looking at. Returns `branchId`, `workspace.path` (edit there: a git worktree on a branch `sneak-peek/<name>`, started from what the source frame shows, uncommitted changes included), `frameId` (the new frame, named after the branch) and `reused`, true when the key already had a branch. The branch's dev server starts on its own port. Also returns `paneUrl`, as `show_off` does, and `pane_not_open` in `issues` while no browser pane shows the canvas.

`branch`: an existing git branch of the user's repo (`feature/x`, or `origin/feature/x` for a remote one, as `look_around` lists them in `project.branches`), to put on the canvas instead of making a new direction. Its frame is a git worktree checked out on that branch itself, named by the branch, with its own dev server: edits in its `workspace.path` are edits on the branch, uncommitted. The user's checkout, index and stash are never touched. `key`, `name`, `sourceFrameId` and `round` are then ignored. Putting a branch that is already on the canvas answers its frame (`reused: true`). The answer has the same fields, plus `branch` and `commit`, with `round` and `sourceFrameId` null. Without `branch`, `key` and `name` are needed (`name_required`). `createLocal: true` agrees to create the local branch for a remote-only one. Errors: `invalid_branch`, `branch_unknown`, `branch_checked_out` (open in another folder, named), `remote_only` (ask, then `createLocal`), `not_git`, `git_missing`.

`round`: which round of directions the new frame joins in its row. `"new"` for the first direction of a new request (the canvas puts it below the earlier ones, with a divider); `"same"` for another direction of the current request. Omitted, it joins the row's latest round when your session started it (when the session is unknown, when that round got a direction in the last 15 minutes) and the user chose nothing in the row since; otherwise it starts a new one. A reused branch keeps its round. The answer's `round` is `{ id, number, startedAt, isNew }`.

## go_with

`frameId`: the frame of the direction the user said they want. The user does not choose on the canvas; they tell you ("I chose C", "the second one"), and you call this. After a checkpoint it brings the direction's changes (its worktree against the checkpoint it started from) into the user's folder as uncommitted changes, and records the choice (look_around's `chosen`, with `inMainCopy`). Nothing is committed. The question it answers is closed: its options leave the canvas, and the main frame shows the decision. One choice per question (one round of directions of a route): choosing another direction of the same question puts back the files the first one wrote and brings the new one in, and the answers to earlier questions stay. A file the user changed since is not overwritten without their say (`main_copy_changed`).

Fails with `choice_conflict` (with `files`) when the user's folder changed a file the direction also changed. Then merge by hand: write the direction's change into that file in their folder, keeping what is there, and call again with `merged: true`, which records the choice and writes nothing.

## whats_changed

Read-only. What changed, as diffs. Without arguments, the changes of the direction the user chose (look_around's `chosen`). `branchId` set to the project's id gives the user's folder against its HEAD, untracked files included: what a commit would hold. `branchId` or `frameId` of a direction gives its worktree against the checkpoint it started from; of a git branch's frame, its worktree against that branch's HEAD.

- `files`: every changed file with `kind` (`added`, `modified`, `deleted`), `binary`, `size` and `sourceFile`: `in_folder` (the user's folder) or `in_direction` (a direction's worktree).
- `patches`, a page of them: `diff` (unified, `git apply` reads it), `tooLarge` when the diff is too long to inline, and `branchFile` (the file itself, to read a binary or a `tooLarge` one).
- `deleted`: the deleted files. Secrets and generated output (`.env*`, keys, `node_modules`, builds) are never read.
- `nextCursor`: when not null, call again with `cursor` set to it for the next page. `paths` limits the answer to those files.
- `target`: for a git branch's frame, `{ branch, commit }`: the branch the frame is checked out on, and its HEAD. Null for the main frame and your own directions.

Nothing here writes. The changes are already in their folders; committing is the user's call (the skill says how). Errors: `no_choice` (nothing chosen and nothing named), `choice_ambiguous` (chosen frames in more than one folder).

## poke_server

`action`: `status` (default), `run`, `stop`, `restart`. `workspaceId` picks a direction's or branch frame's server; omit for the main frame. Returns `state`, `url` and `output`.

## pass_around

`mode: "link"` (default) builds the frame's route to static files, checks them, uploads them and returns `url`; the project has one link, and each frame you share is added to it. `remove: true` takes the frame out; the last one out ends the link. `mode: "local"` builds to a `folder` on this computer and uploads nothing. Only Next.js (static export) and Vite projects can be built this way. Limits: 25 MB in all, 500 files, 4 MB per file.

The build runs in a copy of the frame's folder, and fixes there what a static export cannot run: it leaves out middleware, makes metadata routes (manifest, robots, sitemap, icons) static, and leaves out pages with dynamic segments that have no `generateStaticParams` when the frame does not show them. A route a middleware moved (`/reading` to `/en/reading`) opens where it went. Only the files the page loads in the check go up, so a page of a big app fits the limits; a link to a page left out opens a short "not part of this preview" page. `changes` lists each of these: tell the user what was left out. Do not make these fixes in the user's code yourself; when an error still names something, ask before changing the product for it.
