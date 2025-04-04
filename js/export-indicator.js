/**
 * Ajoute un indicateur d'exportation à chaque élément de code dans la liste
 */
function addExportIndicators() {
    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Observer les changements dans la liste des codes
        const codeListObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    updateExportIndicators();
                }
            });
        });

        // Observer les changements dans la liste des codes
        const codeList = document.getElementById('codeList');
        if (codeList) {
            codeListObserver.observe(codeList, { childList: true });
        }

        // Mettre à jour les indicateurs lors du chargement initial
        updateExportIndicators();
    });
}

/**
 * Met à jour les indicateurs d'exportation pour tous les éléments de code
 */
function updateExportIndicators() {
    // Récupérer tous les éléments de code
    const codeItems = document.querySelectorAll('.code-item');
    
    // Pour chaque élément de code
    codeItems.forEach(function(codeItem) {
        // Récupérer le code
        const code = codeItem.dataset.code;
        
        // Récupérer les données du code depuis le stockage local
        let appSettings = {};
        try {
            const appSettingsJson = localStorage.getItem('appSettings');
            if (appSettingsJson) {
                appSettings = JSON.parse(appSettingsJson);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de appSettings:', error);
        }
        
        // Vérifier si le code est exportable
        let isExportable = true; // Par défaut, tous les codes sont exportables
        
        if (appSettings.codes && appSettings.codes[code]) {
            isExportable = appSettings.codes[code].exportable !== false;
        }
        
        // Vérifier si l'indicateur d'exportation existe déjà
        let exportIndicator = codeItem.querySelector('.export-indicator');
        
        // Si l'indicateur n'existe pas, le créer
        if (!exportIndicator) {
            exportIndicator = document.createElement('div');
            exportIndicator.className = 'export-indicator';
            codeItem.appendChild(exportIndicator);
        }
        
        // Mettre à jour l'indicateur
        if (isExportable) {
            exportIndicator.innerHTML = '✓'; // Symbole de coche simple
            exportIndicator.className = 'export-indicator exportable';
            exportIndicator.title = 'Ce code sera exporté dans le calendrier';
        } else {
            exportIndicator.innerHTML = '✕'; // Symbole X simple
            exportIndicator.className = 'export-indicator not-exportable';
            exportIndicator.title = 'Ce code ne sera pas exporté dans le calendrier';
        }
    });
}

// Initialiser les indicateurs d'exportation
addExportIndicators();
