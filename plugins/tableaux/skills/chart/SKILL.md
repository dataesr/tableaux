---
name: chart
description: "Ajouter un graphique Highcharts à une page de tableau (dossier charts/<name>/ avec index.tsx et utils.tsx, ChartWrapper, useQuery). À utiliser lorsqu'on demande de créer, ajouter ou dupliquer un graphique dans client/src/boards."
argument-hint: "Identifiant du tableau, page et nom du graphique"
user-invocable: true
---

# Graphique

Ajoute un graphique Highcharts. Pour un tableau de bord complet, utilisez la compétence [dashboard](../dashboard/SKILL.md), qui appelle celle-ci pour chaque graphique.

La procédure est dans [reference/new.md](./reference/new.md). Lisez-la avant d'écrire du code, puis lisez un graphique existant du même tableau et reprenez son style (séparateurs, couleurs, filtres, i18n).
