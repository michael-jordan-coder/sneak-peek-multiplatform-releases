# The prototype-canvas tools

Every tool that works on a project takes an optional `projectId`. Without one, it works on the project the session was opened from (a session the app started), else on the project imported from the folder you work in, else, only when nothing says where you work, on the canvas the user has open. The server learns your folder from your client's MCP roots (Claude Code sends them; it asks once per session, or with each call on the newer protocol). A client without roots passes `repoPath`, the folder it works in, to `look` and to the other tools. When that folder has no project yet, the tools say so (`repo_not_imported`) instead of working on another project's canvas. Every result is `{ ok, data, error }`; an error has a `code`, a `message` and `next`, what to do about it.

## look

Read-only. Returns:

- `pages`: the canvas's pages, `[{ id, name }]`. Screens (`screens`) is first and always there: the app's routes. Other pages hold other work, each arranged on its own. Every frame names its `page`, and `showing.page` is the page the user is on.

- `repo`: the folder you work in, as `{ path, projectId, via }`. `via` is `roots` (your client's MCP roots), `repoPath` (you passed it) or `cwd` (a server started over stdio in your folder). `projectId` is the project imported from it, the one look answers about; null means the repo has no project yet, `project` is null too, and `issues` has `repo_not_imported`: call `open_project` with `mode: "import"` and `sourcePath` set to the repo's root. `repo` is null when nothing says where you work (`issues` then has `repo_unknown`: pass `repoPath`).
- `onScreen`: the project the Sneak Peek window shows now. When it is not your repo's project, `issues` has `other_project_on_screen`; tools without `projectId` still work on your repo's project.
- `issues`: what look noticed about where you work, each `{ code, message, next }`. `app_closed` means Sneak Peek is not running: the tools still work, and the ones that change the canvas start its engine.
- `app.running` and `app.windowOpen`: whether Sneak Peek is running, and whether its window is open. `app.version` is the app's version, worth quoting when something does not behave as described here. Without the window, frames cannot be photographed or focused, but you can still edit and report.
- `project`: `id`, `sourcePath` (the user's original folder, never edited by you) and `blank` (a starter app with no source).
- `workspace.path`: the folder to edit.
- `devServer`: `state` (`running`, `starting`, `stopped`, `idle`, `error`, `unknown`), `url`, and the last `output`.
- `frames`: each with `id`, `workspaceId` (the main copy, or a branch), `route`, `name`, position, size and `round` (a branch's round of directions in its row, null for the main copy's frames).
- `rounds`: per row (route), its rounds of directions oldest first, each `{ id, number, startedAt, frameIds, latest }`. The canvas stacks a row's rounds downwards, the newest at the bottom, with a line and "number · time" above each round after the first, so you can say "round 2" and the user finds it.
- `showing`: what the user sees. `onCanvas` is false when they are on Home or on another project. Otherwise `frameId`, `frameName`, `route`, `fullScreen`, `device` (`fill`, `iphone`, `ipad`, `macbook`) and `element`, the element the user picked with Inspect: `element.element` has `tag`, `text`, `className`, `selector` (a short CSS path) and `rect`; `element.chain[0].source` is the file, line and column that wrote it (an absolute path in the working copy), and the rest of `chain` names the components that rendered it, innermost first, each with the line that wrote it. Edit that line, not a lookalike elsewhere. `summary` says the same in a sentence.
  `pointed` is the frame the user last pointed at in the side pane's canvas (`frameId`, `at`), or null: an element picked with the browser pane's own Inspect carries no page address, so this is the frame it belongs to.
- `notes`: notes the user left on frames, with their ids. A note with no `element` is on the whole frame (`variant` is the frame's id). A note with `visitor` is a comment from someone the user shared a link with (`from.link`), not the user's: `visitor` says how to treat it. Notes the user kept from the agent are not listed.
- `chosen`: the frames the user chose, one per route at most (`frameId`, `workspaceId`, `route`, `name`, `chosenAt`, `inMainCopy`). The frames of one route are a group of alternatives: a branch's frame sits on its source's route, so choosing it replaces a choice of the source. Choosing a branch's frame brings its changes into the main working copy (`inMainCopy` true, as it is for a frame of the main copy itself); choosing another frame of the row takes them back out first, and clearing the choice takes them out. A choice made before the canvas did this has `inMainCopy` false.
- `projects`: every project, when called with `includeProjects: true`, each with `sourcePath` (the folder it was imported from, null for a blank one), `branch` and `branchOf` (a branch's parent project; pass the parent's id, not the branch's).

`repoPath`: the folder you work in, when your client sends no MCP roots. The other tools take it too, for their default project.

`url`: a page address as the browser shows it (`http://127.0.0.1:57868/en/about`), or only its origin (an image's `src` carries one). `page` then says which project, working copy (`workspaceId`, `branch`) and frame (`frameId`) it is, and how sure: `match` is `exact` (a frame shows that route), `pointed` (the frame the user pointed at shows that copy), `only_frame`, `prefix` (the frame whose route the path continues) or `workspace` (the frame is unknown; `candidates` lists that copy's frames). `workspace` and `devServer` are that copy's, so `workspace.path` is the folder to edit for that page. An address no running copy serves fails with `url_not_recognized`.

## read_guide

Read-only. Returns this skill's text for a client that does not load skills itself: `section` is `guide` (the way of working, the default), `tools` (this page) or `errors`. Call it once at the start of a session when `prototype-canvas` is not among your skills.

## open_project

`mode`: `existing` (with `projectId`), `import` (with `sourcePath`, the folder to copy, and optionally `name`), or `blank` (a starter app). Importing copies the folder into a new working copy; importing the same folder again reuses it. `devServer`: `start` (default), `restart` or `leave`. Returns the `workspace`, `firstFrameId`, the dev server's state and `paneUrl`, the address that shows this project's canvas in a browser pane (open it there when you have one); `issues` lists what did not work without failing the call.

## show_frames

`frames`: a list of `{ id, route?, name?, width?, height?, workspaceId?, page? }`. An id that exists is updated in place and keeps the fields you omit; a new frame is 1440 by 900 unless you give a size. The canvas arranges the frames itself: columns by route depth (the root screen, then top-level screens, then what is under them), a row per route, a branch's frame to the right of its source. `x` and `y` are accepted and ignored. `route` starts with `/`. `workspaceId` points a frame at a branch; omit it for the main copy. Up to 100 frames per canvas.

`page`: `{ id, name? }`, the page the frames in this call go on, unless a frame names its own `page`. A page the canvas lacks is added, named `name` (else its id). Without either, a new frame goes on Screens and an existing one stays on its page. Each page is arranged on its own.

`focus`: `new` (default) moves the canvas to the frames you just added, `all` to every frame in the call, `none` leaves the view alone. The result's `focus` is `moved` (the window, or a canvas open in a browser pane, moved), `window_closed` (saved, but nothing to move) or `failed`.

`paneUrl`: the address that shows this project's canvas in a browser pane. When you have one (Claude Desktop's Browser pane), open it there after showing frames; the canvas then follows each later `show_frames` by itself. While no pane shows this project's canvas, a call that puts frames on it reports `pane_not_open` in `issues`; it stops once the pane is open. A double-click on a frame there opens its own page, where the pane's Inspect, Reload and sizes work on it; Back returns to the canvas.

`activity`: `{ state: "working" | "idle", message? }` marks the frames in the call: while working they glow on the canvas. Working again without frames keeps the frames marked before; idle ends the glow.

`resolvedNoteIds`: notes you handled, by id from `look`.

`pictures`: a picture of each frame you put or changed (up to four), as the window renders it now, with `state`, `errors` and `imageIndex` as in `capture_frames`. Empty when the window is closed. `capture: false` skips it, for a frame whose dev server is still starting.

## capture_frames

Read-only. `frameIds` defaults to the frame the user is looking at. Each frame comes back with `state` (`rendered`, `error` when the page logged errors, `navigated` when the page left its route, `unavailable`), `errors`, `location`, and `imageIndex`, the position of its picture among the images in the result. Needs the window open; the picture is the page at the frame's size, rendered fresh.

`steps`: run in the page before the picture, in order, with real input, so you see what happens when the page is used, not only how it rests. Each is one of `{ hover }`, `{ click }`, `{ type, into? }`, `{ press }` (Escape, Enter, Tab, ArrowDown, Backspace, or a character), `{ scroll: { x?, y?, target? } }`, `{ wait }` (ms, up to 5000) or `{ shot: true }` (a picture at that point). A target is a CSS selector (`#id`, `.class`, `[name=q]`) or the words on the element (a button's label, a placeholder, a heading); the innermost interactive element with those words wins. Example: `[{ hover: "Count is 0" }, { shot: true }, { click: "Count is 0" }, { press: "Escape" }]`. Each step comes back with `found`, `hit` (what it landed on, like `button "Count is 0"`), `instead` (what the page offers when nothing matched) and `imageIndex` for a `shot`. The final picture is the page as it ended.

## branch_frame

`key`: your stable name for the direction (letters, digits, `_`, `-`). `name`: what the user sees. `sourceFrameId` defaults to the frame the user is looking at. Returns `branchId`, `workspace.path` (edit there), `frameId` (the new frame, named after the branch) and `reused`, true when the key already had a branch. The branch's dev server starts on its own port. Also returns `paneUrl`, as `show_frames` does, and `pane_not_open` in `issues` while no browser pane shows the canvas.

`round`: which round of directions the new frame joins in its row. `"new"` for the first direction of a new request (the canvas puts it below the earlier ones, with a divider); `"same"` for another direction of the current request. Omitted, it joins the row's latest round when your session started it (when the session is unknown, when that round got a direction in the last 15 minutes) and the user chose nothing in the row since; otherwise it starts a new one. A reused branch keeps its round. The answer's `round` is `{ id, number, startedAt, isNew }`.

## choose_frame

`frameId`: the frame of the direction the user said they want. The user does not choose on the canvas; they tell you ("I chose C", "the second one"), and you call this. It brings the direction into the main working copy after a checkpoint and records the choice (look's `chosen`, with `inMainCopy`). The question it answers is closed: its options leave the canvas, and the main frame shows the decision. One choice per question (one round of directions of a route): choosing another direction of the same question swaps it, and the answers to earlier questions stay.

Fails with `choice_conflict` when the main working copy changed a file the direction also changed since it was branched. Then merge by hand: write the direction's change into that file in the main working copy, keeping what is there, and call again with `merged: true`, which records the choice and writes nothing.

## apply_branch

`branchId`, from `branch_frame` or a frame's `workspaceId`. Copies the branch's files into the main working copy after taking a checkpoint of it (`recoveryCheckpoint`). Refuses while a conversation is still working in either copy. `choose_frame` already does this for the direction the user chose (look's `chosen[].inMainCopy`); this is for a branch the user asks to bring in without choosing it.

## branch_changes

Read-only. The changes of the direction the user chose (look's `chosen`), for taking it back to their real repo at `sourcePath`. `branchId` names a branch instead (or the project's own id, for the main working copy's changes since it last matched the source), `frameId` a frame's working copy. A branch is compared with what it was branched from, as `apply_branch` does.

- `files`: every changed file with `kind` (`added`, `modified`, `deleted`), `binary`, `size` and `sourceFile`: `matches_base` (the real repo still has the file as the direction started from, so the diff applies), `matches_branch` (it already has the change), `changed` (it changed since; merge by hand) or `no_source`.
- `patches`, a page of them: `diff` (unified, `git apply` reads it), `content` (the whole new text, for new files and heavily changed ones), `branchFile` (the file in the working copy, to copy a binary or a `tooLarge` one from).
- `deleted`: the files to delete. `omitted`: files the history does not read (secrets, links, very large files); check them by hand.
- `nextCursor`: when not null, call again with `cursor` set to it for the next page. `paths` limits the answer to those files.

Apply in the user's real repo yourself, and only after you showed them the diff and they said yes. Never write there before that. Errors: `no_choice` (nothing chosen and nothing named), `choice_ambiguous` (chosen frames in more than one working copy).

## refresh_from_source

Brings the main working copy up to the user's source folder as it is now. The copy is a snapshot from the import, so directions built on it start from those files; `branch_frame` warns with `source_changed` in its `issues` when the source moved on, and does not refresh by itself. A checkpoint is taken first (`recoveryCheckpoint`), so the refresh can be restored. Returns `changes` (what was written), `sourceMoved` (what changed in the source since the copy last matched it), `skipped` (files the refresh leaves alone: secrets, links, files over 8 MB) and `devServer` (`restarting` when a dependency manifest changed).

When the copy has changes that never went back to the source (`unsynced`), it refuses with `unsynced_changes` and names them. Ask the user: take them back first with `branch_changes` (`branchId`: the project's id), or call again with `force: true` to discard them. `check: true` only reports and writes nothing. Branches are not refreshed; branch again after a refresh.

## dev_server

`action`: `status` (default), `run`, `stop`, `restart`. `workspaceId` picks a branch's server; omit for the main copy. Returns `state`, `url` and `output`.

## share_frame

`mode: "link"` (default) builds the frame's route to static files, checks them, uploads them and returns `url`; the project has one link, and each frame you share is added to it. `remove: true` takes the frame out; the last one out ends the link. `mode: "local"` builds to a `folder` on this computer and uploads nothing. Only Next.js (static export) and Vite projects can be built this way. Limits: 25 MB in all, 500 files, 4 MB per file.

The build runs in a copy of the working copy, and fixes there what a static export cannot run: it leaves out middleware, makes metadata routes (manifest, robots, sitemap, icons) static, and leaves out pages with dynamic segments that have no `generateStaticParams` when the frame does not show them. A route a middleware moved (`/reading` to `/en/reading`) opens where it went. Only the files the page loads in the check go up, so a page of a big app fits the limits; a link to a page left out opens a short "not part of this preview" page. `changes` lists each of these: tell the user what was left out. Do not make these fixes in the working copy yourself; fix there only what the error still names.
