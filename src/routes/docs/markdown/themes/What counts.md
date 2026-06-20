# What Counts in a Theme?

One of the most common questions participants ask is:

**"Does my project count for this theme?"**

This document explains exactly what qualifies for each theme, what does not qualify, and provides examples to help you decide before you start building.

---

## Indie Gamedev

### Core Idea

Build a game (with a unique taste).

If your project is primarily a game created by you, it likely qualifies for this theme.

You may use any programming language, framework, game engine, or toolchain.

The focus is on creating an original game experience rather than building tools or services around games.

PS: Indie Games are known for their experimental and unique vibe, try to incorporate that too

### What Counts

Projects that create a playable game experience.

Examples:

* A platformer made with Godot
* A puzzle game built in Unity
* A text adventure written in Python
* A roguelike made with Rust
* A browser game using JavaScript and Canvas
* A multiplayer game built with custom networking
* A visual novel
* A tower defense game
* A racing game
* A card game
* A Minecraft-inspired sandbox game
* A game created entirely from scratch without an engine

### What Doesn't Count

Projects that are related to gaming but are not actually games.

Examples:

* A game review website
* A Discord bot for game communities
* A game launcher
* A game recommendation app
* A game news website
* A tool that tracks player statistics
* A game marketplace
* A wiki for a game
* A mod for existing games

### Edge Cases

#### Game Engine

A custom game engine by itself generally does not count because it is a tool rather than a game.

However, if you build a playable game using that engine, the project can qualify.


---

## No Internet

### Core Idea

Build something that works completely offline.

The project should continue functioning even if the user's internet connection is disabled.

Think local-first software.

### Requirements

Your project must not require:

* Internet access
* Online APIs
* Cloud databases
* Websites
* Remote servers

Everything should run locally on the device.

### What Counts

Examples:

* A note-taking application
* A local AI assistant powered entirely by on-device models
* A drawing application
* A music player
* A file manager
* A markdown editor
* A retro computer emulator that runs classic software completely offline
* A local document search engine that indexes files without sending data anywhere
* A PDF reader
* A wildlife identification app that performs all image recognition on-device
* A desktop productivity tool

### What Doesn't Count

Examples:

* A social media app
* A weather app using online APIs
* A chatbot that requires cloud inference
* A website
* An online multiplayer game
* A project that stores data only in a cloud database
* An application that fails when disconnected from the internet

### Edge Cases

#### Local Databases

Local databases such as SQLite are allowed.

The restriction is against remote databases that require internet access.

#### AI Models

Locally running AI models are allowed.

Cloud-hosted AI services are not.

#### Optional Online Features

If the project's core functionality works entirely offline, optional online features may be acceptable.

For example:

* A note-taking app that can optionally sync data
* A drawing app that can optionally share files

The primary experience must still work without internet.

---

## Endless

### Core Idea

Build something that has no practical limit.

The project should contain an experience, system, world, space, process, or interaction that can continue indefinitely.

The "endless" aspect should be a meaningful part of the project.

### What Counts

Examples:

#### Endless Worlds

* Procedurally generated worlds
* Infinite terrain generation
* Minecraft-style exploration systems

#### Endless Canvases

* Infinite drawing boards
* Whiteboards without fixed boundaries
* Mind-mapping tools with unlimited space

#### Endless Gameplay

* Endless runners
* Infinite survival games
* Games that continuously generate new levels
* Procedurally generated challenges

#### Endless Systems

* Infinite zoom visualizations
* Fractal explorers
* Continuous simulation environments
* Generative art systems that never stop producing output

### What Doesn't Count

Examples:

* A drawing app with a fixed canvas size
* A game with ten predefined levels
* A slideshow with a finite number of pages
* A calculator
* A fixed-size spreadsheet
* A static website

### Edge Cases

#### Very Large vs Endless

A huge map is not automatically endless.

For example:

* A 100 km × 100 km map is large.
* A procedurally generated map with no boundary is endless.

#### Random Content

Random generation alone does not make a project endless.

The project should be able to continue generating meaningful new content without reaching a defined endpoint.

#### Simulations

Many simulations qualify if they can continue indefinitely and produce evolving outcomes over time.

---

## Can a Project Count for Multiple Themes?

Yes. BUT **It cannot be submitted for multiple themes.** You must choose one theme to submit your project under.

Many projects naturally fit multiple themes.

Examples:

### Offline Endless Runner

* Counts for No Internet
* Counts for Endless

### Offline Procedural Sandbox Game

* Counts for Indie Gamedev
* Counts for No Internet
* Counts for Endless

### Infinite Canvas Drawing App

* Counts for No Internet
* Counts for Endless

### Browser-Based Platformer

* Counts for Indie Gamedev

### Online Multiplayer Infinite World Game

* Counts for Indie Gamedev
* Counts for Endless

It would not count for No Internet because it requires online connectivity.

---

# Rule of Thumb

Ask yourself:

### Indie Gamedev

"Am I building a game with a unique taste?"

### No Internet

"Can someone fully use this without internet access?"

### Endless

"Does a meaningful part of my project continue indefinitely without a hard limit?"

If the answer is yes, your project probably qualifies.
