/**
 * core.js
 * Fonctions de base et initialisation de l'application Calendrier CHAL
 */

// État global de l'application
const appState = {
    imageFile: null,
    results: null,
    isAnalyzing: false,
    personName: '',
    month: new Date().getMonth() + 1, // Mois actuel (1-12)
    year: new Date().getFullYear(),    // Année actuelle
    apiSettings: {
        apiKey: '',
        model: 'mistral-ocr-latest',
        strictMode: true
    },
    codesData: {},
    validCodes: []
};

// Éléments DOM utilisés dans l'application
const elements = {
    dropArea: null,
    fileInput: null,
    filePreview: null,
    previewContainer: null,
    removeImageBtn: null,
    personNameInput: null,
    monthSelect: null,
    yearInput: null,
    analyzeButton: null,
    loadingIndicator: null,
    resultsSection: null,
    resultsContent: null,
    uploadSection: null,
    processingSection: null,
    calendarContainer: null,
    exportButtons: null,
    codeLegendContainer: null,
    codeDropdowns: null,
    manualEntryButton: null
};

/**
 * Initialise les éléments DOM
 */
function initElements() {
    console.log("Initialisation des éléments DOM");
    
    elements.dropArea = document.getElementById('dropArea');
    elements.fileInput = document.getElementById('fileInput');
    elements.filePreview = document.getElementById('filePreview');
    elements.previewContainer = document.getElementById('previewContainer');
    elements.removeImageBtn = document.getElementById('removeImage');
    elements.personNameInput = document.getElementById('personNameInput');
    elements.monthSelect = document.getElementById('monthSelect');
    elements.yearInput = document.getElementById('yearInput');
    elements.analyzeButton = document.getElementById('analyzeButton');
    elements.loadingIndicator = document.getElementById('loadingIndicator');
    elements.resultsSection = document.getElementById('resultsSection');
    elements.resultsContent = document.getElementById('resultsContent');
    elements.uploadSection = document.getElementById('uploadSection');
    elements.processingSection = document.getElementById('processingSection');
    elements.calendarContainer = document.getElementById('calendarContainer');
    elements.exportButtons = document.getElementById('exportButtons');
    elements.codeLegendContainer = document.getElementById('codeLegendContainer');
    elements.codeDropdowns = document.querySelectorAll('.code-dropdown');
}

/**
 * Initialise l'état de l'application
 */
function initAppState() {
    console.log("Initialisation de l'état de l'application");
    
    // Définir le mois et l'année actuels
    if (elements.monthSelect) elements.monthSelect.value = appState.month;
    if (elements.yearInput) elements.yearInput.value = appState.year;
    
    // Mettre à jour l'état du formulaire
    updateFormState();
    
    // Ajouter un écouteur d'événement pour forcer la mise à jour de l'état du formulaire
    // après un court délai (pour s'assurer que tous les éléments sont chargés)
    setTimeout(function() {
        console.log("Mise à jour forcée de l'état du formulaire après délai");
        updateFormState();
    }, 500);
}

/**
 * Initialise les gestionnaires d'événements
 */
function initEventListeners() {
    console.log("Initialisation des gestionnaires d'événements");
    
    // Gestionnaire pour le chargement de fichier
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Gestionnaire pour le glisser-déposer
    if (elements.dropArea) {
        elements.dropArea.addEventListener('dragover', handleDragOver);
        elements.dropArea.addEventListener('drop', handleDrop);
    }
    
    // Gestionnaire pour le bouton d'analyse
    if (elements.analyzeButton) {
        elements.analyzeButton.addEventListener('click', analyzeSchedule);
    }
    
    // Gestionnaire pour le bouton de suppression d'image
    if (elements.removeImageBtn) {
        elements.removeImageBtn.addEventListener('click', removeImage);
    }
    
    // Gestionnaire pour la saisie du nom
    if (elements.personNameInput) {
        elements.personNameInput.addEventListener('input', function() {
            updateFormState();
        });
    }
}

/**
 * Met à jour l'état du formulaire en fonction des entrées utilisateur
 */
function updateFormState() {
    // Mettre à jour l'état du bouton d'analyse
    if (elements.analyzeButton) {
        const hasImage = !!appState.imageFile;
        const hasName = elements.personNameInput && elements.personNameInput.value.trim() !== '';
        
        elements.analyzeButton.disabled = !hasImage || !hasName || appState.isAnalyzing;
        
        if (elements.analyzeButton.disabled) {
            elements.analyzeButton.classList.add('button-disabled');
        } else {
            elements.analyzeButton.classList.remove('button-disabled');
        }
    }
    
    // Mettre à jour la visibilité de la prévisualisation
    if (elements.previewContainer) {
        elements.previewContainer.hidden = !appState.imageFile;
    }
}

/**
 * Initialise l'application
 */
async function initApp() {
    console.log("Initialisation de l'application");
    
    // Initialiser les éléments DOM
    initElements();
    console.log("Éléments DOM initialisés");
    
    // Initialiser l'état de l'application
    initAppState();
    console.log("État de l'application initialisé");
    
    // Mettre à jour l'état du formulaire
    updateFormState();
    
    // Initialiser les gestionnaires d'événements
    initEventListeners();
    console.log("Gestionnaires d'événements initialisés");
    
    // Charger les paramètres API
    await loadApiSettings();
    console.log("Paramètres API chargés:", appState.apiSettings);
    
    // Charger les codes
    await loadCodes();
    console.log("Données des codes chargées:", appState.codesData);
    console.log(`${appState.validCodes.length} codes valides chargés:`, appState.validCodes);
    
    // Créer la légende des codes
    if (elements.codeLegendContainer) {
        elements.codeLegendContainer.innerHTML = '';
        const codeLegend = createCodeLegend();
        elements.codeLegendContainer.appendChild(codeLegend);
        console.log("Légende des codes créée");
    }
    
    // Mettre à jour les listes déroulantes de codes
    updateCodeDropdowns();
    console.log("Listes déroulantes de codes mises à jour");
    
    // Écouter les événements de mise à jour des codes depuis la page des paramètres
    document.addEventListener('codesUpdated', handleCodesUpdated);
    
    // Charger le fichier de paramètres
    loadSettingsFile();
    
    // Ajouter le bouton de saisie manuelle
    addManualEntryButton();
    console.log("Bouton de saisie manuelle ajouté");
}

/**
 * Gère les mises à jour des codes depuis la page des paramètres
 * @param {CustomEvent} event - L'événement personnalisé
 */
async function handleCodesUpdated(event) {
    console.log("Mise à jour des codes détectée:", event.detail);
    
    // Recharger les codes
    await loadCodes();
    
    // Mettre à jour la légende des codes
    if (elements.codeLegendContainer) {
        elements.codeLegendContainer.innerHTML = '';
        const codeLegend = createCodeLegend();
        elements.codeLegendContainer.appendChild(codeLegend);
    }
    
    // Mettre à jour les listes déroulantes de codes
    updateCodeDropdowns();
    
    console.log("Codes mis à jour avec succès");
}

/**
 * Affiche un message toast à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message (info, success, error)
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toastContainer && toastMessage) {
        toastContainer.className = 'toast';
        toastContainer.classList.add(`toast-${type}`);
        toastMessage.textContent = message;
        toastContainer.hidden = false;
        
        setTimeout(() => {
            toastContainer.hidden = true;
        }, 3000);
    }
}

// Initialise l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de l\'application...');
    
    // Exposer les fonctions et objets nécessaires globalement
    window.appState = appState;
    window.elements = elements;
    window.showToast = showToast;
    window.updateFormState = updateFormState;
    
    initApp();
    
    console.log("Application initialisée avec succès");
});

/**
 * Charge le fichier de paramètres sans écraser les paramètres API existants
 */
function loadSettingsFile() {
    fetch('calendrier-chal-settings.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Fichier de paramètres non trouvé');
            }
            return response.json();
        })
        .then(data => {
            console.log("Fichier de paramètres chargé:", data);
            
            // Vérifier si des codes existent déjà dans le localStorage
            const appSettingsJson = localStorage.getItem('appSettings');
            let appSettings = {};
            let existingCodes = null;
            
            if (appSettingsJson) {
                try {
                    appSettings = JSON.parse(appSettingsJson);
                    if (appSettings && appSettings.codes && Object.keys(appSettings.codes).length > 0) {
                        existingCodes = appSettings.codes;
                        console.log("Codes existants trouvés dans localStorage:", Object.keys(existingCodes).length);
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement de appSettings:', error);
                }
            }
            
            // Ne mettre à jour les codes que si aucun code n'existe dans le localStorage
            if (data.codes && !existingCodes) {
                console.log("Aucun code existant, utilisation des codes du fichier JSON");
                
                // Mettre à jour uniquement les codes, pas les paramètres API
                appSettings.codes = data.codes;
                
                // Sauvegarder
                localStorage.setItem('appSettings', JSON.stringify(appSettings));
                console.log(`${Object.keys(data.codes).length} codes mis à jour depuis le fichier de paramètres`);
                
                // Mettre à jour les codes dans l'application
                appState.codesData = data.codes;
                appState.validCodes = Object.keys(data.codes);
                
                // Mettre à jour la légende des codes
                if (elements.codeLegendContainer) {
                    elements.codeLegendContainer.innerHTML = '';
                    const codeLegend = createCodeLegend();
                    elements.codeLegendContainer.appendChild(codeLegend);
                }
                
                // Mettre à jour les listes déroulantes de codes
                updateCodeDropdowns();
            } else if (existingCodes) {
                console.log("Codes existants conservés, ignorant les codes du fichier JSON");
            }
            
            // Ne pas écraser les paramètres API existants si une clé API est déjà configurée
            if (data.apiSettings) {
                if (appSettingsJson) {
                    try {
                        if (appSettings && appSettings.apiSettings && appState.apiSettings.apiKey) {
                            console.log("Paramètres API existants conservés (clé API déjà configurée)");
                            return;
                        }
                    } catch (error) {
                        console.error('Erreur lors du chargement des paramètres API depuis appSettings:', error);
                    }
                }
                
                // Si aucune clé API n'est configurée, utiliser celle du fichier de paramètres
                saveApiSettings(data.apiSettings);
                console.log("Paramètres API mis à jour depuis le fichier de paramètres");
            }
        })
        .catch(error => {
            console.warn("Erreur lors du chargement du fichier de paramètres:", error);
        });
}
