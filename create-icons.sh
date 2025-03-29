#!/bin/bash

# Créer le dossier des icônes s'il n'existe pas
mkdir -p images/icons

# Télécharger une icône de calendrier de base (ou utilisez votre propre icône)
curl -o images/base-icon.png https://cdn-icons-png.flaticon.com/512/2693/2693507.png

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "ImageMagick n'est pas installé. Installation..."
    brew install imagemagick
fi

# Créer les différentes tailles d'icônes
convert images/base-icon.png -resize 72x72 images/icons/icon-72x72.png
convert images/base-icon.png -resize 96x96 images/icons/icon-96x96.png
convert images/base-icon.png -resize 128x128 images/icons/icon-128x128.png
convert images/base-icon.png -resize 144x144 images/icons/icon-144x144.png
convert images/base-icon.png -resize 152x152 images/icons/icon-152x152.png
convert images/base-icon.png -resize 192x192 images/icons/icon-192x192.png
convert images/base-icon.png -resize 384x384 images/icons/icon-384x384.png
convert images/base-icon.png -resize 512x512 images/icons/icon-512x512.png

# Créer une icône pour la page hors ligne
mkdir -p images/offline
convert images/base-icon.png -resize 256x256 -colorspace Gray images/offline/offline.png

echo "Icônes créées avec succès!"
