---
name: dashboard
description: "Create and review tableaux dashboards (boards in dataesr/tableaux). Modes: init (clarify the request and the data source), build (scaffold and implement a confirmed brief), critique (read-only review of usability, data, DSFR and infrastructure), accessibility (read-only RGAA 4 / WCAG 2.1 AA review). Use when the user asks to start, plan, build, review or check a dashboard."
argument-hint: "init | build | critique | accessibility, then the brief or board id"
user-invocable: true
---

# Dashboard

Routes a dashboard task to the matching mode. Read the reference file for the mode before acting. Never use fixtures, sample data or invented numbers.

## Modes

| Mode | Reference | Writes files | Use when |
|------|-----------|--------------|----------|
| `init` | [reference/init.md](./reference/init.md) | No | Starting, scoping or planning a dashboard; choosing the data source |
| `build` | [reference/build.md](./reference/build.md) | Yes | Implementing a dashboard from a confirmed brief |
| `critique` | [reference/critique.md](./reference/critique.md) | No | Reviewing a board before or after a build |
| `accessibility` | [reference/accessibility.md](./reference/accessibility.md) | No (unless asked to fix) | Checking a board against RGAA 4 / WCAG 2.1 AA |

Related skills: [chart](../chart/SKILL.md) for a single Highcharts chart, and [dsfr](../dsfr/SKILL.md) for UI and styling.

## No argument

If no mode is given, show the table above and ask which mode to run, with the board id or brief if relevant. Do not run a mode on your own.

## Order

A new dashboard goes `init` → `build` → `critique` and `accessibility`. `build` runs the accessibility checks itself, so a separate `accessibility` run is only needed for an existing board or a second review.
