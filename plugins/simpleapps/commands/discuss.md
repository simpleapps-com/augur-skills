---
name: discuss
description: Understand the current work better through conversational alignment, wiki context, and session awareness. Use instead of plan mode.
allowed-tools: Bash(git -C:*), Skill(wiki), Read, Glob, Grep, Agent
---

First, use Skill("wiki") to load wiki conventions.

Understand the current work better through conversation. This replaces plan mode. Alignment happens through discussion, not formal plans.

## 1. Orient

Check what context is available:

1. Use Glob to check `wip/*.md` for any WIP files
2. If WIP files exist, read the most recently modified one
3. Review the current session: what has been discussed, changed, or learned so far

If there's a WIP, use it as the starting point. If there's nothing, ask the user what they're working on or thinking about.

## 2. Load the wiki

Use Glob to find all `wiki/*.md` files. Read every page using the Read tool. The wiki MUST be in context before asking the user any questions. It may already document a solution, pattern, or convention that addresses the problem. MUST NOT ask the user something the wiki already answers.

## 3. Discuss

This is a conversation, not a checklist. The goal is to deeply understand:

- **What** the user wants to accomplish
- **Why** it matters: the motivation behind the request
- **Where** it fits: how it relates to existing code, patterns, and wiki conventions
- **What's in scope** and what isn't
- **What already exists**: wiki patterns, existing code, or conventions that apply

### How to discuss

- Ask focused questions, one or two at a time, not a wall of questions
- Listen to the answers and build on them
- Summarize your understanding back to the user so they can correct you
- Check the wiki and codebase before asking; don't ask what you can look up
- Use Grep, Glob, Read, or Agent with subagent_type=Explore to verify assumptions against the actual code
- If the wiki already covers the topic, say so and ask if the user wants to extend or change the existing approach

### What NOT to do

- Do NOT enter plan mode
- Do NOT produce artifacts unless the user asks
- Do NOT rush to solutions; understand first
- Do NOT ask questions the wiki already answers
- Do NOT dump a long list of questions; keep it conversational

## 4. Outcomes

The discussion may naturally lead to:

- Creating new GitHub issues (ask the user before creating)
- Creating new WIP files (ask the user before creating)
- Reframing the original problem
- Discovering the wiki already has the answer
- Splitting one problem into multiple issues
- Deciding not to build something

Follow the user's lead on when to formalize. They will tell you when to create issues, update WIPs, or move to `/implement`.
