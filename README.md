# btrtabs

Better tabs management for Chrome — extension Manifest V3, service worker only.

## Comportement

- **`Ctrl+T` / `⌘T` / bouton « + »** → le nouvel onglet est déplacé tout au début
  de la fenêtre, juste après les onglets épinglés (ou en position 0 s'il n'y en
  a pas).
- **Lien externe ouvrant Chrome** (depuis Slack, mail, Spotlight, drag-n-drop,
  etc.) → déplacé en début de fenêtre comme un Ctrl+T.
- **`Ctrl+Click` sur un lien**, lien `target="_blank"`, `window.open(...)`, etc.
  → l'onglet reste à sa position naturelle (juste après son onglet parent).
  L'extension ne le touche pas.
- **Restauration de session** → laissée telle quelle (les onglets restaurés au
  démarrage gardent leur ordre d'origine grâce à une fenêtre de grâce de 5 s
  après `chrome.runtime.onStartup`).

La distinction est faite dans [`src/background/decide.ts`](src/background/decide.ts) :

- URL initiale = page « Nouvel Onglet » (`chrome://newtab/`, etc.) → Ctrl+T /
  « + », on déplace.
- `tab.active === false` → ouverture en arrière-plan (Ctrl+Click), on ne touche
  pas.
- Pas d'`openerTabId` → ouverture externe sans onglet source, on déplace.
- Avec `openerTabId`, on compare la position : si le nouvel onglet est juste
  après son opener (`tab.index === opener.index + 1`), c'est un clic interne
  (`target="_blank"`, `window.open`), on laisse. Sinon (typiquement créé en
  bout de fenêtre alors que l'opener est ailleurs), c'est un lien externe que
  Chrome a attaché à l'onglet actif comme opener — on déplace.

## Logs

Les `console.log` du service worker passent par un helper
[`src/lib/log.ts`](src/lib/log.ts) qui no-op en build de production (Vite
remplace `import.meta.env.DEV` par `false` puis Rollup tree-shake la branche
dev). Seul `console.warn` reste, pour les erreurs runtime.

## Test manuel

Après `bun run dev` + chargement de `dist/` dans Chrome :

1. **Ctrl+T** → l'onglet doit apparaître en première position (ou juste après
   les épinglés).
2. **Bouton « + »** → idem.
3. Épingler un onglet, puis Ctrl+T → le nouvel onglet doit se placer **après**
   l'épinglé, jamais avant.
4. **Ctrl+Click sur un lien** d'une page → le nouvel onglet doit rester à sa
   position naturelle (juste à droite de l'onglet d'origine).
5. Coller une URL externe dans la barre Spotlight / Slack qui ouvre Chrome →
   l'onglet doit aller **au début** de la fenêtre (juste après les épinglés).
6. Glisser un lien depuis une autre app (Finder, Notes…) vers la fenêtre Chrome
   → l'onglet doit aller au début.
7. Quitter Chrome avec plusieurs onglets puis le relancer → l'ordre des onglets
   restaurés doit être préservé (la fenêtre de grâce empêche tout
   reclassement).

## Stack

- **TypeScript** (strict)
- **Vite** + **@crxjs/vite-plugin** (HMR du service worker, manifest typé)
- **ESLint** (flat config) + **Prettier**

## Setup

```bash
bun install
```

## Développement

```bash
bun run dev
```

Puis dans Chrome :

1. Ouvrir `chrome://extensions`
2. Activer **« Mode développeur »** (en haut à droite)
3. Cliquer **« Charger l'extension non empaquetée »**
4. Sélectionner le dossier `dist/`

Le service worker est rechargé automatiquement à chaque modification.
Pour voir ses logs : sur la fiche de l'extension, cliquer sur **« Service worker »**.

## Build de production

```bash
bun run build
```

Génère `dist/` prêt à être chargé dans Chrome.

## Empaquetage pour le Chrome Web Store

```bash
bun run package
```

Produit `btrtabs-<version>.zip` à uploader sur la
[Chrome Web Store Developer Console](https://chrome.google.com/webstore/devconsole).

Avant la première soumission :

- Remplacer les icônes placeholder dans `public/icons/` par les vraies (16/32/48/128 px)
- Compléter `store/description.md` (description courte + longue, justification des permissions)
- Compléter `store/privacy-policy.md` et l'héberger publiquement (URL requise par le store)
- Ajouter au moins une capture d'écran 1280×800 ou 640×400 dans `store/screenshots/`

## Scripts

| Script              | Description                              |
| ------------------- | ---------------------------------------- |
| `bun run dev`       | Vite en watch mode + HMR                 |
| `bun run build`     | Type-check + bundle prod dans `dist/`    |
| `bun run preview`   | Preview du build prod                    |
| `bun run lint`      | ESLint                                   |
| `bun run lint:fix`  | ESLint + auto-fix                        |
| `bun run format`    | Prettier (write)                         |
| `bun run typecheck` | `tsc --noEmit`                           |
| `bun run zip`       | Zip de `dist/` → `btrtabs-<version>.zip` |
| `bun run package`   | `build` + `zip`                          |

## Structure

```
src/
  manifest.ts          # Manifest V3 typé (généré au build par CRXJS)
  background/index.ts  # Service worker — entry point
  lib/                 # Utilitaires partagés
  types/               # Types TS partagés
public/icons/          # Icônes (copiées telles quelles dans dist/)
store/                 # Assets pour la soumission Chrome Web Store
```

## Permissions actuelles

- `tabs` — lecture/organisation des onglets

À mettre à jour à mesure que les fonctionnalités s'ajoutent (et à refléter dans
`store/description.md` et `store/privacy-policy.md`).

## Sécurité & advisories

`bun audit` signale une vulnérabilité sur `rollup@2.79.2` tiré par
`@crxjs/vite-plugin`. Elle est **build-time uniquement** et non exploitable dans
notre contexte (sources contrôlées). Voir [SECURITY.md](SECURITY.md) pour le
détail et les conditions de réévaluation.
