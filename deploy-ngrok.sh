#!/bin/bash

# Vérifier si ngrok est installé
if ! command -v ngrok &> /dev/null; then
    echo "ngrok n'est pas installé. Installation..."
    brew install ngrok
fi

# Lancer le serveur HTTP Python en arrière-plan
echo "Démarrage du serveur HTTP sur le port 8000..."
python3 -m http.server 8000 &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 2

# Lancer ngrok pour exposer le serveur local à Internet
echo "Démarrage de ngrok pour exposer le port 8000..."
ngrok http 8000

# Fonction pour nettoyer lors de la sortie
cleanup() {
    echo "Arrêt du serveur HTTP..."
    kill $SERVER_PID
    exit 0
}

# Capturer les signaux pour nettoyer
trap cleanup SIGINT SIGTERM

# Attendre que ngrok se termine
wait
