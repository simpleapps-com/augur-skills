---
name: research
description: Deep web research on best practices — verify assumptions, find long-term solutions, document findings with sources. Use anytime the agent is guessing instead of knowing.
argument-hint: "[topic or question]"
allowed-tools: Bash(git -C:*), Skill(wiki), Skill(project-defaults), Read, Write, Glob, Grep, Edit, Agent, WebSearch, WebFetch
---

First, use Skill("wiki") to load project context — the wiki may already document relevant patterns or decisions.

Research the current problem deeply using web sources. This is not about quick answers — it's about finding the best long-term solution backed by verified best practices, official documentation, and community patterns.

## 1. Understand what needs researching

### With an argument

If `$ARGUMENTS` is provided, use it as the research topic or question.

### Without an argument

Check for context in this order:
1. Use Glob to check `wip/*.md` — if a recent WIP exists, extract the problem and suggested approach as the research focus
2. Use the current session context — what was discussed, what problem is being solved
3. If neither provides enough context, ask the user what to research

Identify specifically what needs verification:
- Is the proposed approach actually the best practice?
- Are there better alternatives the agent hasn't considered?
- What does the official documentation say?
- What pitfalls have others encountered?

## 2. Research

Use WebSearch and WebFetch to find authoritative sources. Research in layers:

### Official documentation
Search for the specific frameworks, libraries, and tools involved. Read the official docs — not blog summaries, not Stack Overflow paraphrases. Go to the source.

### Best practices
Search for established patterns for the specific problem type. Look for:
- Official guides and recommendations
- RFC or specification documents
- Framework-endorsed patterns

### Community experience
Search for real-world experience with the approach:
- GitHub issues and discussions on the relevant projects
- Migration guides and upgrade paths
- Post-mortems and lessons learned

### Alternatives
Search for alternative approaches. For each, evaluate:
- Long-term maintainability
- Community adoption and support
- Fit with the current project's stack and patterns

## 3. Evaluate findings

Do NOT just list what you found. Analyze it against the specific project:

- **Does it fit?** — Consider the project's stack, conventions, and constraints (from the wiki)
- **Is it sustainable?** — Will this approach still be right in a year? Is the dependency maintained?
- **What's the trade-off?** — Every approach has downsides. Name them.
- **What do we stop doing?** — If adopting a new pattern, what existing approach does it replace?

## 4. Present findings

Structure the output as a conversation, not a document. Present:

1. **What I researched** — the specific questions investigated
2. **Key findings** — what the authoritative sources say, with links
3. **Recommendation** — the best long-term approach for this project, with reasoning
4. **Alternatives** — what else was considered and why it's less suitable
5. **Risks** — what could go wrong with the recommended approach

Include source URLs for every claim. No unsourced assertions.

## 5. Update WIP (if one exists)

If a WIP file is being used, add research findings to the Research section. Include sources and links so the reasoning is traceable later.

## Rules

- **Go deep, not wide** — 3 authoritative sources beat 10 blog posts
- **Verify, don't validate** — research to find the truth, not to confirm what the agent already thinks
- **Long-term over easy** — prefer sustainable solutions over quick fixes
- **Project-aware** — every recommendation must account for this project's specific context
- **Source everything** — no unsourced claims. If you can't find a source, say so.
- **Be honest about uncertainty** — if the research is inconclusive, say so rather than picking a side
