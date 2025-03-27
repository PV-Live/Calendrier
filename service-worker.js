/**
 * Calendrier Leo - Service Worker
 * Gère la mise en cache et le fonctionnement hors ligne
 */

const CACHE_NAME = 'calendrier-leo-v1';

// Fichiers à mettre en cache lors de l'installation
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/mistral-api.js',
  '/js/calendar-utils.js',
  '/manifest.json',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// Installation du service worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation en cours');
  
  // Mettre en cache les fichiers essentiels
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache des fichiers');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du service worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation en cours');
  
  // Supprimer les anciens caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  console.log('Service Worker: Interception de la requête', event.request.url);
  
  // Stratégie Cache First avec fallback sur le réseau
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          console.log('Service Worker: Réponse depuis le cache pour', event.request.url);
          return response;
        }
        
        // Sinon, faire la requête au réseau
        console.log('Service Worker: Récupération depuis le réseau pour', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // Ne pas mettre en cache les requêtes d'API
            if (event.request.url.includes('/api/') || 
                event.request.url.includes('mistral.ai')) {
              return networkResponse;
            }
            
            // Mettre en cache la nouvelle ressource
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch(error => {
            console.error('Service Worker: Erreur de récupération', error);
            
            // Pour les requêtes d'images, retourner une image par défaut
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return caches.match('/images/offline.png');
            }
            
            // Pour les requêtes HTML, retourner la page hors ligne
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // Pour les autres requêtes, retourner une erreur
            return new Response('Vous êtes hors ligne et cette ressource n\'est pas disponible.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Gestion des messages
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
