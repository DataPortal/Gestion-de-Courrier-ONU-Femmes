# Mini application de gestion du courrier

Application HTML autonome pour le suivi administratif du courrier du secrétariat de la Représentante.

## Fonctionnalités
- Nouveau courrier
- Tableau de suivi
- Mise à jour du statut
- Recherche
- Filtre par statut
- Statistiques
- Export CSV
- Import CSV
- Sauvegarde automatique dans le navigateur

## Structure
- `index.html` : interface principale
- `style.css` : styles
- `app.js` : logique métier
- `.github/workflows/deploy.yml` : déploiement GitHub Pages

## Déploiement GitHub Pages
1. Créer un dépôt GitHub
2. Copier tous les fichiers
3. Pousser le dépôt sur la branche `main`
4. Aller dans `Settings > Pages`
5. Choisir `GitHub Actions`

## Utilisation
- Les scans PDF restent en local
- L’application conserve les métadonnées et le suivi
- Exporter régulièrement le registre en CSV pour archivage

## Exemple de structure locale
```text
D:\COURRIERS_REPRESENTANTE\
├── 2026\
│   ├── 03_Mars\
│   │   ├── Entrants\
│   │   └── Reponses\
