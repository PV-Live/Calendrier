/**
 * Correctif pour le problème du commutateur d'exportation
 * Ce script corrige l'état initial du commutateur d'exportation dans l'éditeur de code
 */

document.addEventListener('DOMContentLoaded', function() {
    // Observer les modifications du DOM pour détecter quand l'éditeur est ouvert
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'textContent') {
                fixExportableToggle();
            }
        });
    });

    // Observer les changements dans le titre de l'éditeur
    const editorTitle = document.getElementById('editorTitle');
    if (editorTitle) {
        observer.observe(editorTitle, { attributes: true, childList: true });
    }

    // Surveiller les clics sur les éléments de code
    document.addEventListener('click', function(event) {
        if (event.target.closest('.code-item')) {
            // Attendre un court instant pour que l'éditeur soit mis à jour
            setTimeout(fixExportableToggle, 50);
        }
    });
});

/**
 * Corrige l'état du commutateur d'exportation dans l'éditeur de code
 */
function fixExportableToggle() {
    // Récupérer le code en cours d'édition
    const editorTitle = document.getElementById('editorTitle');
    if (!editorTitle || !editorTitle.textContent.includes('Modifier le code')) {
        return;
    }

    // Extraire le code du titre
    const codeMatch = editorTitle.textContent.match(/"([^"]+)"/);
    if (!codeMatch || !codeMatch[1]) {
        return;
    }

    const code = codeMatch[1];
    
    // Récupérer les données du code depuis le stockage local
    try {
        const appSettingsJson = localStorage.getItem('appSettings');
        if (appSettingsJson) {
            const appSettings = JSON.parse(appSettingsJson);
            if (appSettings && appSettings.codes && appSettings.codes[code]) {
                const codeData = appSettings.codes[code];
                
                // Mettre à jour l'état du commutateur (par défaut à true si non défini)
                const exportableCheckbox = document.getElementById('exportableCheckbox');
                if (exportableCheckbox) {
                    exportableCheckbox.checked = codeData.exportable !== false;
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors de la correction du commutateur d\'exportation:', error);
    }
}
