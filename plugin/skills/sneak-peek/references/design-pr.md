# A design pull request

When the user asks for a pull request of the chosen direction ("make a PR", "open a pull request"), the change in their folder becomes a branch of its own. The PR is for someone who was not on the canvas, a PM or a developer: it shows the design before and after, marks what changed, and says the direction was picked in Sneak Peek. Keep it short; the pictures carry it.

## Capture before anything moves

The before is what the product looks like without the direction. Get it while it still exists:

- **Asked before `go_with`:** the main frame still shows the old state. `peek` it now, and `peek` the directions that will not be chosen too, for the optional row below. `go_with` takes their options off the canvas.
- **Asked after `go_with`:** the main frame already holds the direction, so it is no longer the before. The before is the checked-out branch's last commit: start its dev server in a temporary worktree of that commit (`git worktree add --detach <folder> HEAD` in `project.sourcePath`, a folder under the system's temp folder), capture it as below, and remove the worktree. Say that uncommitted work of theirs is not in the before.

The after is the chosen frame (the main frame once `go_with` brought it in). Same route, same viewport (`peek` returns each frame's `viewport`), same state: when the change only shows after a hover or a click, give both captures the same `steps`. Look at both pictures before going on.

`peek` puts its pictures in the conversation; it writes no file and returns no element boxes. A PR needs files, so save each one from the frame's own page at the same size: open the frame's dev server address (`devServer.url` from `look_around`, or `poke_server` with the direction's `workspaceId`) plus the frame's route, in a headless browser you have, at the frame's width and height, after the same steps. Check it against the `peek` picture; if they differ, the file is wrong, not the frame. Name them `before.png` and `after.png`.

Wanted from the engine, not there today: `peek` saving its picture to a file it names, and returning the boxes of the elements a diff changed. Until then, do not pass a field for either.

## Mark what changed

Draw a 3px magenta box (`#FF00AA`) around each changed area, with a numbered badge at its top-left corner, on both images with the same numbers. Use whatever image tool you have (Pillow, ImageMagick, sharp).

Take boxes from the page, not from guesses. In the same headless browser, find the elements the diff changes (the components and class names in its files, or `showing.element.selector` when the user picked one) and read `getBoundingClientRect()`. Multiply by the page's `devicePixelRatio` before drawing. An area that exists on only one side (added or removed) gets its box on that side only, keeping its number. Eyeball coordinates only when no element matches, and say so.

Each number gets one line in the PR body: what changed and why.

## Branch, commits and images

Never switch the user's checkout, and never touch their index or stash. Make the PR's branch in a worktree: `git worktree add -b <branch> <folder> <base>` in `project.sourcePath`, with a folder under the system's temp folder and `<base>` the branch they have checked out (ask when it is not the repo's default branch).

1. Take the change from their folder (`whats_changed` with `branchId` the project's id, or only the files the direction wrote; ask which when their folder holds other work too), apply it there with `git apply`, and commit it alone, with a message that says what changed. Their folder keeps its uncommitted changes; say so.
2. Copy the images to `.github/pr-assets/<branch>/` (a `/` in the branch name becomes `-`) and commit them in their own commit.
3. Link the images in the body by that commit's sha, so the links survive later commits: `https://github.com/OWNER/REPO/blob/SHA/.github/pr-assets/BRANCH/after.png?raw=true`.

Commit under the user's own git identity: no `-c user.name`, no `--author`, no trailer naming you, and no line saying an AI wrote it, in the commits or the PR.

Show the user the PR title, body and both marked images, and ask for a clear yes. Pushing and opening the PR publish them. After the yes, push the branch and open the PR (`gh pr create`), then `git worktree remove <folder>`.

Then confirm the images are there. On a private repo the raw link 404s without a login, so a plain fetch proves nothing: check each with `gh api repos/OWNER/REPO/contents/.github/pr-assets/BRANCH/after.png?ref=SHA`. Give the user the PR's link.

## A live link, only on a yes

Offer `pass_around` for the chosen frame, so a reviewer can open the design itself. Say the link is public before you make it, and make it only after the user's explicit yes. Put it in the PR under "UI". Without the yes, or when it fails (`pro_required`, `not_signed_in`), the PR goes without it.

## The directions not chosen (optional)

When you have their pictures, add one row of small images of the directions that were not chosen, each named as on the canvas, so reviewers see a decision was made. Save them as `option-<letter>.png` beside the others. Skip the row when you have no pictures of them; do not rebuild them for it.

## The body

```markdown
## What changed
One or two sentences: what the user sees now, and why.

## UI
| Before | After |
| --- | --- |
| ![Before](https://github.com/OWNER/REPO/blob/SHA/.github/pr-assets/BRANCH/before.png?raw=true) | ![After](https://github.com/OWNER/REPO/blob/SHA/.github/pr-assets/BRANCH/after.png?raw=true) |

1. What changed in this area, and why.
2. ...

Picked in Sneak Peek from N directions. Live: <link, only after the user's yes>

<the row of directions not chosen, when there is one>

## How to test
1. Open <route>.
2. <the step that shows the change>.
```
