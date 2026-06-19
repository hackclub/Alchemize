# Git for Alchemists

If you've never used Git before, don't worry. Git is just a giant save button for your projects.

Instead of ending up with folders like:

```text
project-final
project-final-v2
project-final-v2-final
project-final-v2-final-REAL
project-final-v2-final-REAL-fixed
```

Git keeps track of your changes for you.

For Alchemize, you'll need Git because every project submission must have a GitHub or GitLab repository.

---

## Step 1: Install Git

Download and install Git from:

https://git-scm.com/downloads

After installation, open a terminal and run:

```bash
git --version
```

If you see a version number, you're ready to go.

---

## Step 2: Tell Git Who You Are

Run these commands once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Example:

```bash
git config --global user.name "Ada Lovelace"
git config --global user.email "ada@example.com"
```

Every commit you make will be tagged with this information.

---

## Step 3: Create a Repository

Open your project folder:

```bash
cd my-awesome-project
```

Initialize Git:

```bash
git init
```

Git is now watching your project.

---

## Step 4: Make Something

Create files.

Write code.

Break things.

Fix things.

Build something cool.

---

## Step 5: Check What Changed

Run:

```bash
git status
```

Git will show all files that have been added, modified, or deleted.

You'll probably be seeing this command a lot.

---

## Step 6: Stage Your Changes

Tell Git which files you want to save:

```bash
git add .
```

The dot means:

> "Add everything in this folder."

---

## Step 7: Commit

A commit is a snapshot of your project.

Create one with:

```bash
git commit -m "Add player movement"
```

Or:

```bash
git commit -m "Fix login bug"
```

Or:

```bash
git commit -m "Teach toaster to speak Rust"
```

Write commit messages that describe what changed.

Future-you will thank present-you.

---

## Step 8: Create a GitHub Repository

Go to GitHub and create a new repository.

You can call it whatever you want.

Examples:

* endless-runner
* offline-notes
* potato-powered-os

Copy the repository URL.

It will look something like:

```text
https://github.com/username/project-name.git
```

---

## Step 9: Connect Your Local Repository

Replace the URL below with your own:

```bash
git remote add origin https://github.com/username/project-name.git
```

This tells Git where your project lives online.

---

## Step 10: Push Your Code

Send your commits to GitHub:

```bash
git branch -M main
git push -u origin main
```

Your project is now online.

Congratulations. You've joined the global tradition of staring at terminal windows and feeling powerful.

---

## Everyday Workflow

After the initial setup, you'll usually do:

```bash
git add .
git commit -m "Describe your changes"
git push
```

That's it.

Code.

Commit.

Push.

Repeat.

---

## Useful Commands

See changed files:

```bash
git status
```

See commit history:

```bash
git log
```

See what changed:

```bash
git diff
```

Pull the latest changes:

```bash
git pull
```

---

## Before Submitting to Alchemize

Make sure:

* Your repository is public
* Your latest code is pushed
* Your README is complete
* Your demo video is linked
* Your project screenshot is uploaded

Then you're ready to submit your Mix.

Happy shipping.
