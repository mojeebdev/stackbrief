# stackbrief

A Claude Skill (and general agent-readable spec) that writes `stacks.md` — a technical brief of
what's actually running a project, beyond the generic "Next.js, Vercel, Prisma, Supabase, Claude
API" line.

It documents the layer most stack docs skip: RAG pipelines, fine-tuning, embeddings, vector
databases, agent orchestration, evals/observability — and it always asks who did the prompt
engineering and who optimized it, because that's intellectual work that never shows up in a
dependency scan.

## Author

Built by [Mojeeb Titilayo](https://mojeeb.xyz) ([BlindspotLab](https://blindspotlab.xyz)).

## What it produces

A `stacks.md` file at your project root, structured by layer (frontend, backend, data, infra,
AI model layer, RAG, fine-tuning, agents, evals, and prompt engineering attribution). See
[`stackbrief/references/stacks-md-template.md`](stackbrief/references/stacks-md-template.md) for
the exact shape.

## Install

### npx (fastest)

Once published to npm:

```bash
npx stackbrief            # installs into ./.claude/skills (this project only)
npx stackbrief --global   # installs into ~/.claude/skills (every project)
```

Or, straight from GitHub without publishing to npm at all:

```bash
npx github:<your-username>/stackbrief
```

### Claude Code / Claude Desktop (manual)

Drop the `stackbrief/` folder into your skills directory:

```bash
git clone https://github.com/<your-username>/stackbrief.git
cp -r stackbrief/stackbrief ~/.claude/skills/stackbrief
```

Or, for a single project, place it in that project's `.claude/skills/` directory instead of the
global one.

### Claude.ai (Skills)

Zip the `stackbrief/` folder (the inner one, containing `SKILL.md`) and upload it via
Settings → Capabilities → Skills → Upload skill.

### Any other coding agent

`SKILL.md` is plain Markdown with YAML frontmatter and no Claude-specific tool calls in its
instructions — it's readable as a standalone spec. Point any agent that can read files, run
shell commands, and write files at `stackbrief/SKILL.md` and tell it to follow the workflow.
It works as-is with Claude Code, Cowork, Cursor, or a custom agent loop; adapt the "how to ask
the user a question" mechanism to whatever your agent's interface supports.

## Use

In an agent terminal/chat with the skill installed:

```
Use the stackbrief skill to document this codebase's stack.
```

The skill will:
1. Scan your dependency manifests, configs, and imports to draft the real stack — not just the
   generic layer
2. Ask you to fill any gaps the scan couldn't determine
3. **Always** ask who did the prompt engineering and who optimized it — this step never gets
   skipped or auto-inferred from commit history
4. Write (or update) `stacks.md` at your project root

Re-run it any time the stack changes — it reads the existing `stacks.md` first and updates it
rather than overwriting your prior attribution.

## Why this exists

Most tech-stack write-ups stop at the framework and the database, as if the AI layer — RAG
design, fine-tuning decisions, agent architecture, and the prompt engineering itself — isn't real
engineering work. It usually is, it's usually the hardest part of the build, and it's usually the
part nobody gets credited for. `stackbrief` makes documenting it (and crediting it) the default,
not an afterthought.

## License

MIT — see [LICENSE](LICENSE).