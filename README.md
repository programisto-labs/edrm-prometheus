# @programisto/edrm-prometheus

Petit module Endurance qui expose une route Prometheus prête à l'emploi. Il crée un `Registry` dédié, collecte les métriques par défaut et ajoute deux métriques HTTP : un histogramme de durée (`http_request_duration_seconds`) et un compteur d'erreurs (`http_request_errors_total`). L'endpoint d'exposition est protégé par une liste d'IPs autorisées.

## Prérequis
- Node.js 18+ recommandé
- npm

## Installation
```bash
npm install
npm run build
```

## Scripts utiles
- `npm run start` : lance le serveur compilé (`dist/bin/www`).
- `npm run dev` : compile en continu et redémarre sur changement.
- `npm run build` : compile TypeScript vers `dist/`.
- `npm test` : exécute la suite de tests Mocha.
- `npm run lint` : vérifie le lint des fichiers TypeScript.

## Variables d'environnement principales
- `PROMETHEUS_ACTIVATED` (défaut: `true`) : désactive l'exposition si défini à `false`.
- `PROMETHEUS_IP_ADDRESS` : IP autorisée supplémentaire pour scrapper les métriques (en plus de `127.0.0.1` et `::1`).

## Fonctionnement de la route
Le routeur `PrometheusRouter` ( `src/modules/prometheus/routes/metrics.router.ts` ) :
- monte un middleware qui mesure la durée et les erreurs de chaque requête HTTP ;
- expose `GET /` pour retourner les métriques au format texte Prometheus ;
- refuse l'accès si l'adresse IP de l'appelant n'est pas dans la liste autorisée.

## Exemple d'intégration
```ts
import PrometheusRouter from '@programisto/edrm-prometheus/dist/modules/prometheus/routes/metrics.router.js';
app.use('/metrics', PrometheusRouter.router);
```
Exposer ensuite `GET /metrics` à Prometheus (en veillant à autoriser l'IP du scrapper).

## Développement
- Code source dans `src/`, transpilation vers `dist/`.
- Point d'entrée CLI : `src/bin/www.ts` (importe l'app locale si disponible, sinon `@programisto/endurance`).
- Pensez à recompiler (`npm run build`) avant `npm start`.

## Licence
ISC – voir `LICENSE`.

