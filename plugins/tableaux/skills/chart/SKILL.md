---
name: chart
description: "Add a Highcharts chart to a board page (charts/<name>/ folder with index.tsx and utils.tsx, ChartWrapper, useQuery). Use when asked to create, add or duplicate a chart in client/src/boards."
argument-hint: "Board id, page and chart name"
user-invocable: true
---

# Chart

Adds one Highcharts chart. For a whole dashboard, use the [dashboard](../dashboard/SKILL.md) skill, which calls this one per chart.

The recipe is in [reference/new.md](./reference/new.md). Read it before writing code, then read an existing chart in the same board and copy its style (separators, colours, filters, i18n).
