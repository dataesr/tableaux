---
name: dashboard
description: "Créer et relire des tableaux de bord (tableaux dans dataesr/tableaux). Modes : init (clarifier la demande et la source de données), build (créer la structure et implémenter un cahier des charges validé), critique (revue critique en lecture seule de l'ergonomie, des données, du DSFR et de l'infrastructure), accessibility (revue en lecture seule RGAA 4 / WCAG 2.1 AA). À utiliser lorsque l'utilisateur demande de démarrer, planifier, construire, relire ou vérifier un tableau de bord."
argument-hint: "init | build | critique | accessibility, puis le cahier des charges ou l'identifiant du tableau"
user-invocable: true
---

# Tableau de bord

Oriente une tâche de tableau de bord vers le mode correspondant. Lisez le fichier de référence du mode avant d'agir. N'utilisez jamais de jeux de test (fixtures), de données d'exemple ni de chiffres inventés.

## Modes

| Mode | Référence | Écrit des fichiers | Utiliser quand |
|------|-----------|--------------------|----------------|
| `init` | [reference/init.md](./reference/init.md) | Non | Démarrer, cadrer ou planifier un tableau de bord ; choisir la source de données |
| `build` | [reference/build.md](./reference/build.md) | Oui | Implémenter un tableau de bord à partir d'un cahier des charges validé |
| `critique` | [reference/critique.md](./reference/critique.md) | Non | Relire un tableau avant ou après une construction |
| `accessibility` | [reference/accessibility.md](./reference/accessibility.md) | Non (sauf demande de correction) | Vérifier un tableau selon le RGAA 4 / WCAG 2.1 AA |

Compétences associées : [chart](../chart/SKILL.md) pour un seul graphique Highcharts, et [dsfr](../dsfr/SKILL.md) pour l'interface et le style.

## Aucun argument

Si aucun mode n'est indiqué, affichez le tableau ci-dessus et demandez quel mode lancer, avec l'identifiant du tableau ou le cahier des charges si pertinent. Ne lancez aucun mode de votre propre initiative.

## Ordre

Un nouveau tableau de bord suit l'ordre `init` → `build` → `critique` et `accessibility`. `build` exécute lui-même les vérifications d'accessibilité ; une exécution séparée de `accessibility` n'est donc nécessaire que pour un tableau existant ou une seconde relecture.
