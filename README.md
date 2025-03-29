# Calendrier Leo - PWA avec Mistral OCR

Une Progressive Web App (PWA) pour analyser des images de planning et les convertir en calendrier au format JSON ou ICS.

## Fonctionnalités

- Analyse d'images de planning avec Mistral OCR
- Extraction des codes de travail pour une personne spécifique
- Édition manuelle des résultats
- Export au format ICS (iCalendar) pour l'intégration avec d'autres applications de calendrier
- Export au format JSON pour une intégration personnalisée
- Fonctionne hors ligne (sauf pour l'analyse d'images)
- Installation possible sur mobile et desktop (PWA)

## Installation

1. Clonez ce dépôt ou téléchargez les fichiers
2. Configurez votre clé API Mistral OCR (voir ci-dessous)
3. Démarrez un serveur web local pour tester l'application

```bash
# Rendre le script de démarrage exécutable
chmod +x start-server.sh

# Démarrer le serveur
./start-server.sh
```

4. Ouvrez votre navigateur à l'adresse http://localhost:8000

## Configuration de l'API Mistral OCR

Pour utiliser l'API Mistral OCR, vous devez obtenir une clé API auprès de Mistral AI et la configurer dans l'application :

1. Créez un compte sur [Mistral AI](https://mistral.ai/)
2. Obtenez une clé API dans votre espace développeur
3. Ouvrez le fichier `js/mistral-api.js`
4. Remplacez la valeur de `apiKey` dans l'objet `MISTRAL_API_CONFIG` par votre clé API :

```javascript
const MISTRAL_API_CONFIG = {
    apiKey: 'VOTRE_CLE_API_MISTRAL',
    endpoint: 'https://api.mistral.ai/v1/ocr',
    model: 'mistral-ocr-medium'
};
```

**Note :** Sans clé API configurée, l'application fonctionnera en mode démo avec des données simulées.

## Utilisation

1. Chargez une image de planning en la glissant-déposant ou en cliquant sur le bouton "Parcourir"
2. Entrez le nom de la personne dont vous souhaitez extraire le planning
3. Sélectionnez le mois et l'année correspondant au planning
4. Cliquez sur "Analyser l'image"
5. Modifiez les résultats si nécessaire
6. Exportez les résultats au format ICS ou JSON

## Personnalisation des codes

L'application utilise une légende de codes par défaut, mais vous pouvez la personnaliser en modifiant le fichier `js/app.js` :

```javascript
// Légende par défaut
appState.codeLegend = {
    'JBD': 'Jour de bureau - Domicile',
    'JBB': 'Jour de bureau - Bureau',
    'RH': 'Ressources Humaines',
    'CP': 'Congé Payé',
    'M': 'Maladie',
    'F': 'Formation'
};
```

## Déploiement

Pour déployer cette PWA sur un serveur web :

1. Téléchargez tous les fichiers sur votre serveur web
2. Assurez-vous que votre serveur est configuré pour servir les fichiers statiques
3. Configurez HTTPS (requis pour les PWA)
4. Configurez votre clé API Mistral OCR

## Technologies utilisées

- HTML5, CSS3, JavaScript (ES6+)
- API Mistral OCR pour l'analyse d'images
- Service Workers pour le fonctionnement hors ligne
- Web App Manifest pour l'installation sur les appareils

## Limitations

- L'analyse d'images nécessite une connexion Internet et une clé API Mistral OCR
- La précision de l'analyse dépend de la qualité de l'image et de la clarté du planning
- Certains navigateurs anciens peuvent ne pas prendre en charge toutes les fonctionnalités PWA

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Développé par Antoine Lemay © 2025
