/**
 * Calendrier CHAL - Application principale
 * Gère l'interface utilisateur et les interactions
 */

// État de l'application
const appState = {
    imageFile: null,
    fileName: '',
    personName: '',
    month: new Date().getMonth() + 1, // Mois actuel (1-12)
    year: new Date().getFullYear(),
    isAnalyzing: false,
    results: null,
    codeLegend: {},
    extractedNames: [], // Nouveau: liste des noms extraits de l'image
    validCodes: [], // Liste des codes valides
    codesData: {} // Données complètes des codes
};

// Éléments DOM
let elements = {};

/**
 * Initialise les éléments DOM
 */
function initElements() {
    console.log("Initialisation des éléments DOM");
    
    elements = {
        // Sections principales
        uploadSection: document.getElementById('uploadSection'),
        processingSection: document.getElementById('processingSection'),
        resultsSection: document.getElementById('resultsSection'),
        settingsSection: document.getElementById('settingsSection'),
        
        // Zone de dépôt et sélection de fichier
        dropArea: document.getElementById('dropArea'),
        fileInput: document.getElementById('fileInput'),
        filePreview: document.getElementById('filePreview'),
        previewContainer: document.getElementById('previewContainer'),
        removeImageBtn: document.getElementById('removeImage'),
        
        // Éléments de traitement
        personNameInput: document.getElementById('personNameInput'),
        personNameContainer: document.getElementById('personNameContainer'),
        monthSelect: document.getElementById('monthSelect'),
        yearInput: document.getElementById('yearInput'),
        analyzeButton: document.getElementById('analyzeButton'),
        
        // Résultats
        personNamesList: document.getElementById('personNamesList'),
        resultsTableBody: document.getElementById('resultsTableBody'),
        resultsContent: document.getElementById('resultsContent'),
        exportIcsButton: document.getElementById('exportIcsButton'),
        exportJsonButton: document.getElementById('exportJsonButton'),
        copyButton: document.getElementById('copyButton'),
        calendarContainer: document.getElementById('calendarContainer'),
        exportButtons: document.getElementById('exportButtons'),
        
        // Paramètres
        apiKeyInput: document.getElementById('apiKeyInput'),
        saveSettingsButton: document.getElementById('saveSettingsButton'),
        settingsButton: document.getElementById('settingsButton'),
        
        // Autres éléments
        loadingIndicator: document.getElementById('loadingIndicator'),
        toastContainer: document.getElementById('toastContainer'),
        toastMessage: document.getElementById('toastMessage'),
        codeLegendContainer: document.getElementById('codeLegendContainer')
    };
    
    console.log("Éléments DOM initialisés");
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
    
    // Gestionnaire pour le bouton d'analyse
    if (elements.analyzeButton) {
        elements.analyzeButton.addEventListener('click', analyzeSchedule);
    }
    
    // Gestionnaire pour la saisie du nom
    if (elements.personNameInput) {
        elements.personNameInput.addEventListener('input', function() {
            console.log("Nom saisi:", this.value);
            updateFormState();
        });
    }
    
    // Gestionnaires pour les boutons d'exportation
    if (elements.exportIcsButton) {
        elements.exportIcsButton.addEventListener('click', exportToICS);
    }
    
    if (elements.exportJsonButton) {
        elements.exportJsonButton.addEventListener('click', exportToJSON);
    }
    
    if (elements.copyButton) {
        elements.copyButton.addEventListener('click', copyToClipboard);
    }
    
    console.log("Gestionnaires d'événements initialisés");
}

/**
 * Met à jour l'état du formulaire
 */
function updateFormState() {
    console.log("Mise à jour de l'état du formulaire");
    
    // Vérifier si un nom a été saisi
    const personName = elements.personNameInput ? elements.personNameInput.value.trim() : '';
    
    // Activer/désactiver le bouton d'analyse
    if (elements.analyzeButton) {
        const canAnalyze = (appState.imageFile !== null && personName !== '');
        elements.analyzeButton.disabled = !canAnalyze;
        
        if (canAnalyze) {
            elements.analyzeButton.classList.add('active');
        } else {
            elements.analyzeButton.classList.remove('active');
        }
    }
    
    // Mettre à jour l'état de l'application
    appState.personName = personName;
    appState.month = elements.monthSelect ? parseInt(elements.monthSelect.value) : new Date().getMonth() + 1;
    appState.year = elements.yearInput ? parseInt(elements.yearInput.value) : new Date().getFullYear();
}

/**
 * Analyse le planning pour le nom sélectionné
 * @async
 */
async function analyzeSchedule() {
    console.log("Analyse du planning");
    
    // Vérifier si une image est chargée
    if (!appState.imageFile) {
        showToast("Veuillez sélectionner une image", "error");
        return;
    }
    
    // Vérifier si un nom a été saisi
    if (!appState.personName) {
        showToast("Veuillez saisir un nom", "error");
        return;
    }
    
    // Afficher l'indicateur de chargement
    if (elements.loadingIndicator) {
        elements.loadingIndicator.hidden = false;
    }
    
    // Masquer le contenu des résultats pendant le chargement
    if (elements.resultsContent) {
        elements.resultsContent.hidden = true;
    }
    
    // Afficher la section des résultats
    if (elements.resultsSection) {
        elements.resultsSection.hidden = false;
    }
    
    // Mettre à jour l'état de l'application
    appState.isAnalyzing = true;
    
    try {
        // Récupérer les paramètres API
        const apiSettings = await loadApiSettings();
        
        // Vérifier si une clé API est disponible
        if (!apiSettings.apiKey) {
            showToast("Aucune clé API configurée. Veuillez configurer une clé API dans les paramètres.", "error");
            
            // Masquer l'indicateur de chargement
            if (elements.loadingIndicator) {
                elements.loadingIndicator.hidden = true;
            }
            
            appState.isAnalyzing = false;
            return;
        }
        
        // Analyser l'image avec l'API Mistral
        console.log("Analyse de l'image avec l'API Mistral");
        const ocrResult = await analyzeImageWithMistral(appState.imageFile, apiSettings.apiKey);
        
        if (!ocrResult || !ocrResult.text) {
            throw new Error("Erreur lors de l'analyse de l'image");
        }
        
        console.log("Texte OCR extrait:", ocrResult.text);
        
        // Tenter d'extraire les données structurées
        let result = null;
        let structuredData = null;
        
        try {
            // Essayer d'extraire les données structurées si une clé API est disponible
            if (apiSettings.apiKey) {
                console.log("Tentative d'extraction des données structurées");
                structuredData = await extractStructuredDataFromOCR(ocrResult.text, apiSettings.apiKey);
                
                if (structuredData && Array.isArray(structuredData)) {
                    console.log("Données structurées extraites:", structuredData);
                    
                    // Rechercher la personne dans les données structurées
                    const personData = findPersonInStructuredData(structuredData, appState.personName);
                    
                    if (personData) {
                        console.log("Personne trouvée dans les données structurées:", personData);
                        
                        // Convertir les données structurées en résultat
                        result = convertStructuredDataToResult(personData, appState.month, appState.year, ocrResult.text);
                    } else {
                        console.log("Personne non trouvée dans les données structurées, utilisation de l'analyse classique");
                    }
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'extraction des données structurées:", error);
            console.log("Utilisation de l'analyse classique comme fallback");
        }
        
        // Si les données structurées n'ont pas fonctionné, utiliser l'analyse classique
        if (!result) {
            console.log("Analyse classique du texte OCR");
            result = analyzeOcrText(ocrResult.text, appState.personName, appState.month, appState.year);
        }
        
        // Mettre à jour l'état de l'application
        appState.results = result;
        
        // Afficher les résultats
        displayResults(result);
        
        // Masquer l'indicateur de chargement
        if (elements.loadingIndicator) {
            elements.loadingIndicator.hidden = true;
        }
        
        // Afficher le contenu des résultats
        if (elements.resultsContent) {
            elements.resultsContent.hidden = false;
        }
        
        console.log("Analyse terminée avec succès");
    } catch (error) {
        console.error("Erreur lors de l'analyse:", error);
        
        // Afficher un message d'erreur
        showToast("Erreur lors de l'analyse: " + error.message, "error");
        
        // Masquer l'indicateur de chargement
        if (elements.loadingIndicator) {
            elements.loadingIndicator.hidden = true;
        }
    } finally {
        // Mettre à jour l'état de l'application
        appState.isAnalyzing = false;
    }
}

/**
 * Recherche une personne dans les données structurées
 * @param {Array} structuredData - Données structurées
 * @param {string} personName - Nom de la personne à rechercher
 * @returns {Object|null} - Données de la personne ou null si non trouvée
 */
function findPersonInStructuredData(structuredData, personName) {
    console.log("Recherche de la personne dans les données structurées:", personName);
    
    // Convertir le nom recherché en minuscules pour une comparaison insensible à la casse
    const searchName = personName.toLowerCase();
    
    // Parcourir les données structurées
    for (const person of structuredData) {
        // Vérifier si le nom de la personne est défini
        if (person.name) {
            // Convertir le nom de la personne en minuscules
            const personNameLower = person.name.toLowerCase();
            
            // Vérifier si le nom correspond
            if (personNameLower.includes(searchName) || searchName.includes(personNameLower)) {
                console.log("Personne trouvée:", person.name);
                return person;
            }
        }
    }
    
    console.log("Personne non trouvée dans les données structurées");
    return null;
}

/**
 * Convertit les données structurées en résultat
 * @param {Object} personData - Données de la personne
 * @param {number} month - Mois (1-12)
 * @param {number} year - Année
 * @param {string} rawText - Texte brut OCR
 * @returns {Object} - Résultat de l'analyse
 */
function convertStructuredDataToResult(personData, month, year, rawText) {
    console.log("Conversion des données structurées en résultat");
    
    // Calculer le nombre de jours dans le mois
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Créer un tableau de codes vides
    const codes = Array(daysInMonth).fill('');
    
    // Remplir le tableau avec les codes de la personne
    if (personData.codes && Array.isArray(personData.codes)) {
        for (let i = 0; i < Math.min(personData.codes.length, daysInMonth); i++) {
            const code = personData.codes[i];
            
            // Vérifier si le code est valide
            if (code && isValidCode(code)) {
                codes[i] = code;
            } else if (code) {
                // Essayer de trouver le code le plus similaire
                const similarCode = findMostSimilarCode(code, appState.validCodes);
                if (similarCode) {
                    console.log(`Code corrigé: ${code} -> ${similarCode}`);
                    codes[i] = similarCode;
                } else {
                    codes[i] = code; // Utiliser le code tel quel s'il n'y a pas de correction
                }
            }
        }
    }
    
    // Créer le résultat
    return {
        found: true,
        name: personData.name,
        codes: codes,
        rawText: rawText,
        month: month,
        year: year
    };
}

/**
 * Initialise l'application
 */
async function initApp() {
    console.log("Initialisation de l'application");
    
    // Initialiser les éléments DOM
    initElements();
    
    // Initialiser l'état de l'application
    initAppState();
    
    // Initialiser les gestionnaires d'événements
    initEventListeners();
    
    // Charger les paramètres API
    await loadApiSettings();
    
    // Charger les codes
    await loadCodes();
    
    // Ajouter le bouton de saisie manuelle
    addManualEntryButton();
    
    // Exposer les fonctions globalement pour les autres modules
    window.appState = appState;
    window.elements = elements;
    window.showToast = showToast;
    window.updateFormState = updateFormState;
    window.isValidCode = isValidCode;
    window.getCodeColor = getCodeColor;
    window.getCodeDescription = getCodeDescription;
    window.getCodeHours = getCodeHours;
    window.findMostSimilarCode = findMostSimilarCode;
    
    console.log("Application initialisée");
}

/**
 * Gère les mises à jour des codes depuis la page des paramètres
 * @param {CustomEvent} event - L'événement personnalisé
 */
function handleCodesUpdated(event) {
    console.log("Mise à jour des codes reçue:", event.detail);
    
    // Mettre à jour les codes dans l'application
    if (event.detail && event.detail.codes) {
        appState.validCodes = event.detail.codes;
        appState.codesData = event.detail.codesData || {};
        
        // Mettre à jour les listes déroulantes de codes
        updateCodeDropdowns();
    }
}

/**
 * Met à jour toutes les listes déroulantes de codes
 */
function updateCodeDropdowns() {
    console.log("Mise à jour des listes déroulantes de codes");
    
    // Sélectionner toutes les listes déroulantes de codes
    const codeDropdowns = document.querySelectorAll('.code-dropdown');
    
    // Parcourir les listes déroulantes
    codeDropdowns.forEach(dropdown => {
        // Sauvegarder la valeur sélectionnée
        const selectedValue = dropdown.value;
        
        // Vider la liste déroulante
        dropdown.innerHTML = '';
        
        // Ajouter l'option vide
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '-- Sélectionner --';
        dropdown.appendChild(emptyOption);
        
        // Ajouter les options pour chaque code
        appState.validCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} - ${getCodeDescription(code)}`;
            dropdown.appendChild(option);
        });
        
        // Restaurer la valeur sélectionnée
        dropdown.value = selectedValue;
    });
}

// Initialise l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de l\'application...');
    
    // Initialiser l'application
    initApp();
    
    // Ajouter un écouteur d'événement pour les mises à jour des codes
    document.addEventListener('codesUpdated', handleCodesUpdated);
});
