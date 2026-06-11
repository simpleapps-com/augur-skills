# Work Habits

Do exactly what was asked. No extra features, no refactoring beyond the request. Read error overlays before guessing at problems. Use dedicated tools (Read, Edit, Write) over shell equivalents (`cat`, `sed`, `echo >`); for search use Bash, preferring `rg` (Claude Code removed its built-in Grep/Glob tools).

If a check or build fails, fix it. There is no such thing as a "pre-existing issue." Do not skip failures, do not classify them as "not from our changes", do not continue hoping someone else will fix them. Fix every failure you encounter.

After completing work: report what changed, suggest `/verify` if untested, then stop. MUST NOT suggest committing, pushing, submitting, or creating PRs. The user will initiate those when ready.

Load Skill("work-habits") for full conventions on autonomous work.
