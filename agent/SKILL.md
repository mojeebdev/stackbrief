---
name: stackbrief
description: Create a source-cited architectural brief before planning or making a repository change.
---

# StackBrief: the architectural brief before a code change

Use this workflow when a developer asks to change code, investigate a likely change, review the impact of a planned edit, or asks which files matter before implementation.

StackBrief is static, local analysis. It provides evidence and constraints; it does not replace runtime verification, product decisions, or developer judgement.

## Before changing code

1. Identify the most likely source file to change. If there are several plausible entry points, state the ambiguity and ask the developer which one they intend to touch.
2. From the repository root, run:

   ```sh
   stackbrief brief --file <path>
   ```

3. Read the brief before proposing or applying the implementation. Carry forward the cited routes, services, databases, external APIs, direct dependents, test targets, and unknowns that are relevant to the requested change.
4. Do not invent architecture that the brief does not evidence. Explicitly distinguish static findings from assumptions needing runtime, configuration, feature-flag, or product confirmation.

## Before a commit or review

After a real change has been staged, run:

```sh
stackbrief brief --staged
```

Use the result as a compact review checklist. Do not stage artificial changes merely to invoke this command.

## When StackBrief is unavailable

Explain that the pre-change brief could not be generated. Continue only with normal repository inspection, clearly labelling the result as manual rather than StackBrief-derived evidence.

## Principle

The purpose is not to make a developer slower or second-guess them. It is to make the architectural consequences visible before they touch the code or delegate a prompt.
