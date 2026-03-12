#!/bin/bash
# ─────────────────────────────────────────────
# WanderLocal — Push to GitHub (run this once)
# ─────────────────────────────────────────────
#
# STEP 1: Go to https://github.com/new
#         Create a repo named: wanderlocal
#         Set it to Public or Private
#         Do NOT add README, .gitignore or license (we already have them)
#         Click "Create repository"
#
# STEP 2: Copy your repo URL, it looks like:
#         https://github.com/YOUR_USERNAME/wanderlocal.git
#
# STEP 3: Run these commands in your terminal:

cd wanderlocal

git remote add origin https://github.com/YOUR_USERNAME/wanderlocal.git

git push -u origin main

# ─────────────────────────────────────────────
# That's it. Your code is on GitHub.
# ─────────────────────────────────────────────
#
# TOMORROW — to pick up where you left off:
#   git pull origin main        ← get latest
#   npm install                 ← install deps
#   npm start                   ← run locally
#
# WHEN YOU MAKE CHANGES:
#   git add .
#   git commit -m "feat: describe what you built"
#   git push
# ─────────────────────────────────────────────
