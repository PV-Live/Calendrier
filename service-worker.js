/**
 * Calendrier CHAL - Service Worker
 * Gère la mise en cache et les fonctionnalités hors ligne
 */

// Version du cache - à incrémenter lors des mises à jour
const CACHE_VERSION = 'v5';
const CACHE_NAME = `calendrier-chal-cache-${CACHE_VERSION}`;

// Fichiers à mettre en cache
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/settings.html',
    '/offline.html',
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

// Fichiers à toujours récupérer depuis le réseau (pas de cache)
const NETWORK_FIRST_FILES = [
    '/css/styles.css',
    '/js/app.js',
    '/js/mistral-api.js',
    '/js/calendar-utils.js',
    '/js/settings.js',
    '/calendrier-chal-settings.json'
];

// Installation du service worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installation en cours');
    
    // Forcer l'activation immédiate sans attendre la fermeture des onglets
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Mise en cache des fichiers');
                return cache.addAll(FILES_TO_CACHE);
            })
    );
});

// Activation du service worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activation en cours');
    
    // Supprimer les anciens caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Prendre le contrôle immédiatement de toutes les pages
    return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    console.log('Service Worker: Interception de la requête', event.request.url);
    
    // Vérifier si l'URL correspond à un fichier qui doit toujours être récupéré depuis le réseau
    const url = new URL(event.request.url);
    const shouldUseNetworkFirst = NETWORK_FIRST_FILES.some(file => url.pathname.endsWith(file));
    
    if (shouldUseNetworkFirst) {
        // Stratégie Network First pour les fichiers JS et CSS
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Mettre en cache la nouvelle ressource
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                            console.log('Service Worker: Mise à jour du cache pour', event.request.url);
                        });
                    
                    return networkResponse;
                })
                .catch(error => {
                    console.log('Service Worker: Erreur réseau, tentative de récupération depuis le cache', error);
                    return caches.match(event.request);
                })
        );
    } else {
        // Stratégie Cache First pour les autres fichiers
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        console.log('Service Worker: Réponse depuis le cache pour', event.request.url);
                        return cachedResponse;
                    }
                    
                    // Si pas en cache, récupérer depuis le réseau
                    return fetch(event.request)
                        .then(networkResponse => {
                            // Ne pas mettre en cache les réponses non valides
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }
                            
                            // Mettre en cache la nouvelle ressource
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            
                            return networkResponse;
                        })
                        .catch(error => {
                            // En cas d'erreur réseau et si la requête concerne une page HTML
                            if (event.request.url.match(/\.(html)$/)) {
                                return caches.match('/offline.html');
                            }
                            
                            console.error('Service Worker: Erreur lors de la récupération', error);
                            return new Response('Erreur de connexion');
                        });
                })
        );
    }
});

// Gestion des messages
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
