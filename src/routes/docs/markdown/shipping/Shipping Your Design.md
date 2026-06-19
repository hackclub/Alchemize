---
title: Shipping your Design - Alchemize
description: Shiiping your design in Alchemize
---

> This doc is written by AI and reviewed by our team.
>
> Projects must contain meaningful completed work before submission. Repositories containing only ideas, placeholder files, AI-generated scaffolding, or less than 1 hour of genuine work may be returned without review.
>
> AI assistance is allowed, but AI-generated content must not exceed **30% of the overall project**. Submissions that exceed this limit may be **instantly rejected**.
>
> You must understand, test, modify, and be able to explain any AI-generated code, designs, documentation, or assets included in your project.

# Submitting Your Project

This applies to software, hardware, and CAD projects submitted to Alchemize Season 1 (S1). Before your project can be reviewed and start earning rewards, it must meet the requirements below.

We want participants to build real, complete projects that can be understood, used, or recreated by others.

There are two key requirements:

* A good README
* A complete, working project

If either is missing, your project may be returned for revisions. Please read through all requirements carefully before submitting.

## 95% of rejections come from problems that take 5 minutes to fix

Missing files, broken links, unclear documentation, fully vibe-coded project, or incomplete READMEs are the most common reasons projects get returned. Double-check your submission before sending it for review.

---

# Themes (S1)

Every project must fit into one of the Season 1 themes.

### Endless

**Currency Earned:** Redstone

Projects that can continue growing indefinitely, such as community platforms, productivity tools, utilities, operating systems, large-scale software, hardware ecosystems, or long-term projects.

You earn **1 Redstone per hour** worked on an Endless project.

### No Internet

**Currency Earned:** Glowstone

Projects designed to work without an internet connection. Examples include offline-first applications, local networking tools, embedded devices, standalone hardware, educational software, or survival-oriented technology.

You earn **1 Glowstone per hour** worked on a No Internet project.

### Indie Game Development

**Currency Earned:** Aqua Regia

Games, game engines, game tools, game assets, interactive experiences, and other projects focused on independent game development.

You earn **1 Aqua Regia per hour** worked on an Indie Game Development project.

---

# 1. A Good README

Your README is the first thing reviewers will see. Someone visiting your repository should understand what your project does, how it works, and why it exists without needing to open any source files.

At minimum, your README should include:

## Description

* A short description of what your project is and what makes it unique
* Detailed instructions explaining how to use it
* Why you made it and the problem you are trying to solve

## Visuals

### Software Projects

* Screenshots or a GIF showing the project in action
* A Playable URL linking to the deployed project
* If the project cannot be deployed (for example, a CLI application), link to the repository instead

### Hardware Projects

* Screenshots of the complete assembled design
* PCB renders if a PCB is used
* A wiring diagram if no PCB is used
* A Demo URL linking to a short video showing the device working

### CAD Projects

* Screenshots or renders of the complete model
* Assembly images if applicable
* Images showing important design details

---

# 2. A Complete Project

To be considered complete, another person should be able to understand your project and either run it, build it, or modify it using the files provided in your repository.

A project that only works for its creator is not considered shipped.

Before submitting, your project should also show at least **1 hour of real logged work**.

For software projects, this will usually be Hackatime hours.

For hardware and CAD projects, this may be journal hours or other approved work logs.

Projects with little or no actual work completed may be returned without review.

---

# Rewards

Rewards are earned based on verified hours worked on your project.

| Theme                  | Currency   | Earned     |
| ---------------------- | ---------- | ---------- |
| Endless                | Redstone   | 1 per hour |
| No Internet            | Glowstone  | 1 per hour |
| Indie Game Development | Aqua Regia | 1 per hour |

Only legitimate project work counts toward rewards.

Spam, duplicate work, AI-generated work submitted without understanding, or artificially inflated hours may be rejected.

---

# Software Repository Requirements

Your repository should contain:

* All source code (not only compiled builds)
* A dependency file such as `package.json`, `requirements.txt`, `Cargo.toml`, etc.
* Clear installation instructions
* Instructions for running the project locally
* A `.gitignore` excluding generated files such as `node_modules`, `.env`, build folders, and caches
* A working deployment or demo link whenever possible

---

# Hardware Repository Requirements

Your repository should contain:

* A BOM (Bill of Materials) in CSV format with links to purchase each component
* PCB source files (`.kicad_pro`, `.kicad_sch`, `.kicad_pcb`, or EasyEDA equivalents)
* A `gerbers.zip` archive
* CAD source files if applicable
* Firmware source code and build instructions
* Any additional files required to reproduce the project

---

# CAD Project Requirements

If your project involves 3D modeling, parametric design, mechanical engineering, or printable components, additional requirements apply.

Use a proper CAD tool and include all source files.

## Approved CAD Software

* Fusion 360
* Onshape
* Shapr3D
* SolidWorks
* FreeCAD
* OpenSCAD
* Blender
* SolveSpace

TinkerCAD is not accepted because it does not provide the source files needed for review.

If you wish to use another CAD tool, contact the organizers before submitting.

## Required CAD Deliverables

For every custom-designed part, include:

* The original source file from your CAD software
* A STEP export of each designed component
* An STL export of each designed component
* A short explanation in the README describing the design and how parts fit together if applicable

CAD projects do **not** need to be physically printed.

Reviewers will evaluate the design files and documentation provided in your repository.

---

# Repository Requirements for Everyone

Projects should be:

* Your own work
* Well-organized
* Easy to understand
* Properly documented
* Structured with sensible file names and folders

AI-assisted code, designs, and content are allowed if:

* You understand them
* You have tested them
* You can explain how they work
* You have improved or customized them for your project

Projects copied from tutorials or other creators are not acceptable.

Learning from references is encouraged, but the final project must be your own work.

---

# Project URL Requirements

Every project includes a URL field. What belongs there depends on the project type.

## Software Projects — Playable URL

Provide:

* A deployed version of the project, or
* The repository link if deployment is not possible

The Playable URL is required for software projects.

## Hardware Projects — Demo URL

Provide a public video showing the hardware operating as described in the README.

Accepted examples include:

* YouTube videos
* Slack-hosted videos
* Any publicly accessible video link

The Demo URL is required for completed hardware projects.

## CAD Projects — Project URL

Provide:

* The GitHub repository containing the CAD files

The repository must include all required source files, STEP exports, and STL exports.

# What Counts as Working?

A project is considered working if its primary functionality can be demonstrated and evaluated by reviewers.

Examples:

* Software projects should launch and perform their intended purpose.
* Hardware projects should be demonstrated operating in a public demo video.
* CAD projects should contain complete design files that can be inspected, modified, or manufactured.

Projects do not need every planned feature to be complete, but the core functionality should be implemented and documented.

---

# Submission Checklist

Before submitting:

- [ ] README is complete and accurate
- [ ] Required screenshots, renders, or videos are included
- [ ] All source files are present
- [ ] Installation, build, or assembly instructions are provided
- [ ] Required project URL, demo URL, or repository URL is included
- [ ] At least 1 hour of verified project work is logged
- [ ] Repository is publicly accessible
- [ ] All links work correctly
- [ ] AI-generated content does not exceed 30% of the project
- [ ] You can explain every part of your submission

---

# What Not to Include

Do not submit:

* AI-generated work that you do not understand or cannot explain
* Projects copied from other creators
* AI-written journals
* Missing source files
* Incomplete repositories
* Stolen content
* Fraudulent submissions
* AI-written READMEs
* Projects where AI-generated content exceeds 30% of the total submission

Projects containing copied work, misleading submissions, or unreviewed AI-generated content presented as original work may be permanently rejected from the program.
