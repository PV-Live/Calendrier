# MyMedICal - Convertisseur de Planning en Calendrier ICS

Une Application web pour analyser des images de planning de personnel médical et les convertir en calendrier au format ICS, facilitant l'intégration avec vos applications de calendrier préférées.

## Fonctionnalités

- Analyse d'images de planning avec Google Vision API
- Extraction des codes de travail pour une personne spécifique
- Saisie manuelle des codes de planning
- Contrôle précis des jours à exporter via un système de cases à cocher
- Export au format ICS (iCalendar) pour l'intégration avec d'autres applications de calendrier
- Fonctionne hors ligne (sauf pour l'analyse d'images)
- Installation possible sur mobile et desktop (PWA)

## Configuration de l'API Google Vision

Pour utiliser l'API Google Vision, vous devez obtenir une clé API auprès de Google Cloud et la configurer dans l'application :

1. Créez un compte sur [Google Cloud Platform](https://cloud.google.com/)
2. Créez un nouveau projet et activez l'API Vision
3. Créez une clé API dans la section "Identifiants"
4. Dans l'application, allez dans "Paramètres" et entrez votre clé API dans le champ prévu à cet effet

**Note :** Sans clé API configurée, l'application fonctionnera uniquement en mode saisie manuelle.

## Guide d'utilisation

### Analyse d'une image de planning

1. Sur la page d'accueil, cliquez sur "Parcourir" pour sélectionner une image de votre planning
2. Entrez le nom de la personne dont vous souhaitez extraire le planning
3. Sélectionnez le mois et l'année correspondant au planning
4. Cliquez sur "Analyser le planning"
5. L'application analysera l'image et extraira les codes de travail

### Saisie manuelle des codes

Si vous préférez saisir manuellement les codes ou si l'analyse d'image n'est pas disponible :

1. Cliquez sur le bouton "Saisie manuelle" 
2. Entrez les codes séparés par des virgules ou des espaces
3. Cliquez sur "Appliquer les codes"

### Personnalisation de l'exportation

Une fois les codes affichés dans le calendrier :

1. Certains jours peuvent être marqués avec des hachures diagonales, indiquant qu'ils ne seront pas exportés par défaut (généralement les jours de repos)
2. Pour inclure un jour spécifique dans l'exportation, cochez la case correspondante dans la cellule du calendrier
3. Pour exclure un jour, décochez la case

### Exportation au format ICS

1. Une fois que vous avez personnalisé les jours à exporter, cliquez sur le bouton "Exporter en ICS"
2. Le fichier ICS sera téléchargé et pourra être importé dans votre application de calendrier préférée (Google Calendar, Outlook, Apple Calendar, etc.)

### Gestion des codes

Dans la section "Paramètres" :

1. Vous pouvez ajouter, modifier ou supprimer des codes de travail
2. Pour chaque code, vous pouvez définir :
   - Une description
   - Une couleur pour l'affichage dans le calendrier
   - Les heures de début et de fin
   - Si le code doit être exporté par défaut
   - Si le code représente une nuit (s'étendant sur deux jours), l'heure de fin sera sur le jour d'après.

## Fonctionnalités avancées

### Système de remplacements d'exportation

L'application permet de contrôler finement quels jours sont inclus dans l'exportation ICS :

- Par défaut, certains codes (comme les jours de repos) peuvent être configurés pour ne pas être exportés
- Grâce au système de cases à cocher, vous pouvez réactiver l'exportation pour des jours spécifiques
- Ces préférences sont sauvegardées entre les sessions

### Mode hors ligne

L'application fonctionne également hors ligne :

- Toutes les fonctionnalités sauf l'analyse d'image sont disponibles sans connexion internet
- Les paramètres et les codes sont sauvegardés localement
- Les préférences d'exportation sont conservées

## Dépannage

- Si l'analyse d'image ne fonctionne pas, vérifiez que votre clé API est correctement configurée
- Si certains codes ne sont pas reconnus, vous pouvez les ajouter manuellement dans les paramètres
- Pour réinitialiser l'application, supprimez les données du site dans les paramètres de votre navigateur
- Vous pouvez contacter l'équipe de développement si vous rencontrez des problèmes.
