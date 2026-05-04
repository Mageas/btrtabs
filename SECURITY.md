# Security

## Reporting a vulnerability

Pour rapporter une faille concernant l'extension btrtabs : ouvrir une issue privée
ou contacter le mainteneur directement (TODO: email).

## Known accepted advisories

### CVE-2026-27606 — `rollup@2.79.2` (Path Traversal at build time)

- **Avis** : <https://github.com/advisories/GHSA-mw96-cpmx-2vgc>
- **Chaîne** : `btrtabs → @crxjs/vite-plugin@2.4.0 → rollup@2.79.2`
- **Statut** : **accepté**, non corrigé.

**Pourquoi ce n'est pas un risque pour ce projet :**

1. La vulnérabilité affecte uniquement le **process de build**, jamais le code
   embarqué dans l'extension publiée — `rollup@2.79.2` n'est pas inclus dans
   `dist/`. Le `rollup@4.60.2` utilisé à l'exécution par Vite est déjà patché.
2. L'exploitation requiert que Rollup traite un input (nom de fichier, import
   dynamique) **contrôlé par un attaquant**. Ce projet ne build que ses propres
   sources TypeScript dans [`src/`](src/) — aucun input externe non vérifié.
3. `@crxjs/vite-plugin@2.4.0` (sortie mars 2026, latest) **épingle exactement**
   `rollup: 2.79.2` ; aucune version de patch n'est disponible upstream.
4. Bun ne supporte pas les `overrides` nested ni la syntaxe yarn
   `pkg/dep` permettant de scoper un override à cette chaîne précise.

**Conditions de réévaluation :**

- Si `@crxjs/vite-plugin` publie une version qui bumpe rollup → mettre à jour
  immédiatement et retirer cette section.
- Si on commence à builder du code tiers non vérifié (ex. plugin marketplace,
  imports dynamiques d'URLs externes) → patcher via `bun patch` ou switcher de
  bundler.
- Si Bun ajoute le support des nested overrides → utiliser un override scopé.
