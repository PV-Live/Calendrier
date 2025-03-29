#!/bin/bash
# Script pour démarrer un serveur web local pour tester la PWA

# Déterminer le chemin du dossier actuel
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Démarrage du serveur web pour Calendrier Leo PWA..."
echo "URL: http://localhost:8000"
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer un serveur Python simple
cd "$DIR"
python3 -m http.server 8000
