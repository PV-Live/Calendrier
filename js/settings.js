/**
 * Calendrier Leo - Gestion des paramètres
 * Gère les codes, leurs descriptions et les heures de service
 */

// Structure des données pour les codes
// {
//   "code": {
//     description: "Description du code",
//     startTime: "09:00",
//     endTime: "17:00",
//     color: "#4285f4"
//   }
// }

// État de l'application
const settingsState = {
    codes: {},
    currentEditingCode: null,
    apiSettings: {
        apiKey: '',
        model: 'mistral-ocr-medium',
        strictMode: true // Mode strict activé par défaut
    }
};

// Éléments DOM
const elements = {
    // Recherche et liste de codes
    codeSearch: document.getElementById('codeSearch'),
    codeList: document.getElementById('codeList'),
    addCodeBtn: document.getElementById('addCodeBtn'),
    
    // Éditeur de code
    codeEditor: document.getElementById('codeEditor'),
    editorTitle: document.getElementById('editorTitle'),
    codeForm: document.getElementById('codeForm'),
    codeInput: document.getElementById('codeInput'),
    descriptionInput: document.getElementById('descriptionInput'),
    startTimeInput: document.getElementById('startTimeInput'),
    endTimeInput: document.getElementById('endTimeInput'),
    colorInput: document.getElementById('colorInput'),
    saveCodeBtn: document.getElementById('saveCodeBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    deleteCodeBtn: document.getElementById('deleteCodeBtn'),
    
    // Configuration API
    apiSettingsForm: document.getElementById('apiSettingsForm'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    modelSelect: document.getElementById('modelSelect'),
    strictModeCheckbox: document.getElementById('strictModeCheckbox'),
    
    // Import/Export
    exportSettingsBtn: document.getElementById('exportSettingsBtn'),
    importFileInput: document.getElementById('importFileInput'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

/**
 * Initialisation de l'application
 */
function initSettings() {
    // Charger les codes depuis le stockage local
    loadCodes();
    
    // Charger les paramètres de l'API
    loadApiSettings();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
    
    // Afficher la liste des codes
    renderCodeList();
    
    // Initialiser l'éditeur
    resetCodeEditor();
}

/**
 * Configure tous les écouteurs d'événements
 */
function setupEventListeners() {
    // Recherche de code
    elements.codeSearch.addEventListener('input', filterCodeList);
    
    // Ajout et édition de code
    elements.addCodeBtn.addEventListener('click', resetCodeEditor);
    elements.codeForm.addEventListener('submit', handleCodeFormSubmit);
    elements.cancelEditBtn.addEventListener('click', resetCodeEditor);
    elements.deleteCodeBtn.addEventListener('click', handleDeleteCode);
    
    // Configuration API
    elements.apiSettingsForm.addEventListener('submit', handleApiFormSubmit);
    
    // Import/Export
    elements.exportSettingsBtn.addEventListener('click', exportSettings);
    elements.importFileInput.addEventListener('change', importSettings);
}

/**
 * Charge les codes depuis le stockage local
 */
function loadCodes() {
    // Essayer d'abord de charger depuis appSettings (nouvelle méthode)
    const appSettingsJson = localStorage.getItem('appSettings');
    if (appSettingsJson) {
        try {
            const appSettings = JSON.parse(appSettingsJson);
            if (appSettings && appSettings.codes) {
                settingsState.codes = appSettings.codes;
                console.log("Codes chargés depuis appSettings:", Object.keys(settingsState.codes));
                return;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des codes depuis appSettings:', error);
        }
    }
    
    // Essayer ensuite de charger depuis codeLegend (ancienne méthode)
    const savedCodes = localStorage.getItem('codeLegend');
    if (savedCodes) {
        try {
            settingsState.codes = JSON.parse(savedCodes);
            console.log("Codes chargés depuis codeLegend:", Object.keys(settingsState.codes));
            
            // Migrer les codes vers appSettings
            saveToAppSettings();
            
            // Supprimer l'ancienne clé
            localStorage.removeItem('codeLegend');
            
            return;
        } catch (error) {
            console.error('Erreur lors du chargement des codes depuis codeLegend:', error);
        }
    }
    
    // Si aucun code n'est trouvé, essayer de charger depuis le fichier JSON
    loadCodesFromJsonFile();
}

/**
 * Sauvegarde les codes dans le stockage local
 */
function saveCodes() {
    // Sauvegarder également dans appSettings
    saveToAppSettings();
}

/**
 * Sauvegarde les codes dans appSettings
 */
function saveToAppSettings() {
    // Charger les paramètres actuels
    let appSettings = {};
    const appSettingsJson = localStorage.getItem('appSettings');
    if (appSettingsJson) {
        try {
            appSettings = JSON.parse(appSettingsJson);
        } catch (error) {
            console.error('Erreur lors du chargement de appSettings:', error);
        }
    }
    
    // Mettre à jour les codes
    appSettings.codes = settingsState.codes;
    
    // Sauvegarder
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    console.log("Codes sauvegardés dans appSettings:", Object.keys(settingsState.codes));
}

/**
 * Charge les codes depuis le fichier JSON
 */
function loadCodesFromJsonFile() {
    fetch('calendrier-leo-settings.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Fichier de paramètres non trouvé');
            }
            return response.json();
        })
        .then(data => {
            console.log("Fichier de paramètres chargé:", data);
            
            if (data.codes) {
                // Mettre à jour les codes
                settingsState.codes = data.codes;
                console.log(`${Object.keys(data.codes).length} codes chargés depuis le fichier de paramètres`);
                
                // Sauvegarder les codes dans appSettings
                saveToAppSettings();
                
                // Mettre à jour l'affichage
                renderCodeList();
            } else {
                // Si le fichier JSON ne contient pas de codes, utiliser les codes par défaut
                settingsState.codes = getDefaultCodes();
                saveToAppSettings();
            }
            
            // Mettre à jour les paramètres de l'API
            if (data.apiSettings) {
                settingsState.apiSettings = data.apiSettings;
                
                // Mettre à jour les champs du formulaire
                if (elements.apiKeyInput && settingsState.apiSettings.apiKey) {
                    elements.apiKeyInput.value = settingsState.apiSettings.apiKey;
                }
                
                if (elements.modelSelect && settingsState.apiSettings.model) {
                    elements.modelSelect.value = settingsState.apiSettings.model;
                }
                
                if (elements.strictModeCheckbox) {
                    elements.strictModeCheckbox.checked = settingsState.apiSettings.strictMode;
                }
                
                // Sauvegarder les paramètres de l'API
                saveApiSettings();
            }
        })
        .catch(error => {
            console.warn("Erreur lors du chargement du fichier de paramètres:", error);
            // Utiliser les codes par défaut
            settingsState.codes = getDefaultCodes();
            saveToAppSettings();
        });
}

/**
 * Retourne les codes par défaut
 */
function getDefaultCodes() {
    return {
        "C9E": {
            "description": "C9E",
            "startTime": "08:30",
            "endTime": "18:00",
            "color": "#ff7b24"
        },
        "FH": {
            "description": "Formation en heures",
            "startTime": "09:00",
            "endTime": "17:00",
            "color": "#3e9c1c"
        },
        "J2B": {
            "description": "J2B",
            "startTime": "09:00",
            "endTime": "17:00",
            "color": "#f4ed1f"
        },
        "J9B": {
            "description": "J9B",
            "startTime": "09:00",
            "endTime": "15:30",
            "color": "#f1f443"
        },
        "JPX": {
            "description": "JPX",
            "startTime": "07:15",
            "endTime": "19:30",
            "color": "#fbff00"
        },
        "M7M": {
            "description": "M7M",
            "startTime": "07:45",
            "endTime": "15:15",
            "color": "#e7ea34"
        },
        "N7H": {
            "description": "Nuit 7heure",
            "startTime": "19:15",
            "endTime": "07:30",
            "color": "#1f71f4"
        },
        "RH": {
            "description": "repos Hebdomadaire",
            "startTime": "09:00",
            "endTime": "17:00",
            "color": "#f143f4"
        },
        "RC": {
            "description": "Repos copensatoire",
            "startTime": "09:00",
            "endTime": "17:00",
            "color": "#f143f4"
        },
        "M7E": {
            "description": "M7E",
            "startTime": "07:30",
            "endTime": "15:00",
            "color": "#f4ee43"
        }
    };
}

/**
 * Charge les paramètres de l'API depuis le stockage local
 */
function loadApiSettings() {
    console.log("Début du chargement des paramètres API");
    
    // Essayer d'abord de charger depuis appSettings (nouvelle méthode)
    const appSettingsJson = localStorage.getItem('appSettings');
    if (appSettingsJson) {
        try {
            const appSettings = JSON.parse(appSettingsJson);
            console.log("appSettings trouvé dans localStorage:", {
                hasApiSettings: !!appSettings.apiSettings,
                hasCodes: !!appSettings.codes
            });
            
            if (appSettings && appSettings.apiSettings) {
                settingsState.apiSettings.apiKey = appSettings.apiSettings.apiKey || '';
                settingsState.apiSettings.model = appSettings.apiSettings.model || 'mistral-ocr-medium';
                settingsState.apiSettings.strictMode = appSettings.apiSettings.strictMode !== false;
                
                // Mettre à jour les champs du formulaire
                elements.apiKeyInput.value = settingsState.apiSettings.apiKey;
                elements.modelSelect.value = settingsState.apiSettings.model;
                elements.strictModeCheckbox.checked = settingsState.apiSettings.strictMode;
                
                console.log("Paramètres API chargés depuis appSettings:", {
                    apiKeyPresent: !!settingsState.apiSettings.apiKey,
                    model: settingsState.apiSettings.model,
                    strictMode: settingsState.apiSettings.strictMode
                });
                return;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API depuis appSettings:', error);
        }
    } else {
        console.log("Aucun appSettings trouvé dans localStorage");
    }
    
    // Essayer ensuite de charger depuis apiSettings (ancienne méthode)
    const savedSettings = localStorage.getItem('apiSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            settingsState.apiSettings.apiKey = parsedSettings.apiKey || '';
            settingsState.apiSettings.model = parsedSettings.model || 'mistral-ocr-medium';
            settingsState.apiSettings.strictMode = parsedSettings.strictMode !== false;
            
            // Mettre à jour les champs du formulaire
            elements.apiKeyInput.value = settingsState.apiSettings.apiKey;
            elements.modelSelect.value = settingsState.apiSettings.model;
            elements.strictModeCheckbox.checked = settingsState.apiSettings.strictMode;
            
            console.log("Paramètres API chargés depuis apiSettings (ancienne méthode):", {
                apiKeyPresent: !!settingsState.apiSettings.apiKey,
                model: settingsState.apiSettings.model,
                strictMode: settingsState.apiSettings.strictMode
            });
            
            // Migrer vers appSettings
            saveApiSettings();
            
            // Supprimer l'ancienne clé
            localStorage.removeItem('apiSettings');
            
            return;
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API:', error);
        }
    } else {
        console.log("Aucun apiSettings trouvé dans localStorage");
    }
    
    // Fallback sur la clé API stockée directement (pour la compatibilité)
    const directApiKey = localStorage.getItem('mistralApiKey');
    if (directApiKey) {
        settingsState.apiSettings.apiKey = directApiKey;
        elements.apiKeyInput.value = directApiKey;
        console.log("Clé API chargée depuis le stockage direct (ancienne méthode):", {
            apiKeyPresent: !!directApiKey
        });
        
        // Migrer vers appSettings
        saveApiSettings();
        
        // Ne pas supprimer l'ancienne clé pour la compatibilité
        // localStorage.removeItem('mistralApiKey');
    } else {
        console.log("Aucune clé API trouvée dans le stockage direct");
    }
}

/**
 * Sauvegarde les paramètres de l'API dans le stockage local
 */
function saveApiSettings() {
    console.log("Début de la sauvegarde des paramètres API");
    console.log("Paramètres API à sauvegarder:", {
        apiKeyPresent: !!settingsState.apiSettings.apiKey,
        model: settingsState.apiSettings.model,
        strictMode: settingsState.apiSettings.strictMode
    });
    
    // Charger les paramètres actuels de appSettings
    let appSettings = {};
    const appSettingsJson = localStorage.getItem('appSettings');
    if (appSettingsJson) {
        try {
            appSettings = JSON.parse(appSettingsJson);
            console.log("appSettings existants chargés:", {
                hasCodes: !!appSettings.codes,
                hasApiSettings: !!appSettings.apiSettings
            });
        } catch (error) {
            console.error('Erreur lors du chargement de appSettings:', error);
        }
    }
    
    // Mettre à jour les paramètres API
    appSettings.apiSettings = settingsState.apiSettings;
    
    // Sauvegarder dans appSettings
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    console.log("Paramètres API sauvegardés dans appSettings");
    
    // Sauvegarder également dans le stockage direct pour la compatibilité
    localStorage.setItem('mistralApiKey', settingsState.apiSettings.apiKey);
    console.log("Clé API sauvegardée également dans le stockage direct (pour compatibilité)");
}

/**
 * Affiche la liste des codes
 */
function renderCodeList() {
    // Vider la liste
    elements.codeList.innerHTML = '';
    
    // Récupérer les codes triés par ordre alphabétique
    const sortedCodes = Object.keys(settingsState.codes).sort();
    
    // Filtrer les codes si une recherche est active
    const searchTerm = elements.codeSearch.value.toLowerCase();
    const filteredCodes = searchTerm 
        ? sortedCodes.filter(code => 
            code.toLowerCase().includes(searchTerm) || 
            settingsState.codes[code].description.toLowerCase().includes(searchTerm)
          )
        : sortedCodes;
    
    // Afficher chaque code
    if (filteredCodes.length === 0) {
        elements.codeList.innerHTML = '<div class="empty-state">Aucun code trouvé</div>';
    } else {
        filteredCodes.forEach(code => {
            const codeData = settingsState.codes[code];
            const codeItem = document.createElement('div');
            codeItem.className = 'code-item';
            codeItem.dataset.code = code;
            
            // Ajouter un indicateur de couleur
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.backgroundColor = codeData.color || '#4285f4';
            
            // Ajouter le code et sa description
            const codeText = document.createElement('div');
            codeText.className = 'code-text';
            
            const codeLabel = document.createElement('strong');
            codeLabel.textContent = code;
            
            const codeDescription = document.createElement('span');
            codeDescription.textContent = codeData.description;
            
            codeText.appendChild(codeLabel);
            codeText.appendChild(document.createTextNode(' - '));
            codeText.appendChild(codeDescription);
            
            // Ajouter les heures
            const codeHours = document.createElement('div');
            codeHours.className = 'code-hours';
            codeHours.textContent = `${codeData.startTime} - ${codeData.endTime}`;
            
            // Assembler l'élément
            codeItem.appendChild(colorIndicator);
            codeItem.appendChild(codeText);
            codeItem.appendChild(codeHours);
            
            // Ajouter l'écouteur d'événement pour l'édition
            codeItem.addEventListener('click', () => {
                editCode(code);
            });
            
            // Ajouter à la liste
            elements.codeList.appendChild(codeItem);
        });
    }
}

/**
 * Filtre la liste des codes en fonction de la recherche
 */
function filterCodeList() {
    renderCodeList();
}

/**
 * Édite un code existant
 */
function editCode(code) {
    const codeData = settingsState.codes[code];
    if (!codeData) return;
    
    // Mettre à jour l'état
    settingsState.currentEditingCode = code;
    
    // Mettre à jour le titre
    elements.editorTitle.textContent = `Modifier le code "${code}"`;
    
    // Remplir le formulaire
    elements.codeInput.value = code;
    elements.descriptionInput.value = codeData.description || '';
    elements.startTimeInput.value = codeData.startTime || '09:00';
    elements.endTimeInput.value = codeData.endTime || '17:00';
    elements.colorInput.value = codeData.color || '#4285f4';
    
    // Afficher le bouton de suppression
    elements.deleteCodeBtn.style.display = 'inline-block';
}

/**
 * Réinitialise l'éditeur de code
 */
function resetCodeEditor() {
    // Réinitialiser l'état
    settingsState.currentEditingCode = null;
    
    // Réinitialiser le formulaire
    elements.codeForm.reset();
    elements.codeInput.value = '';
    elements.descriptionInput.value = '';
    elements.startTimeInput.value = '09:00';
    elements.endTimeInput.value = '17:00';
    elements.colorInput.value = '#4285f4';
    
    // Mettre à jour le titre
    elements.editorTitle.textContent = 'Ajouter un nouveau code';
    
    // Masquer le bouton de suppression
    elements.deleteCodeBtn.style.display = 'none';
}

/**
 * Gère la soumission du formulaire de code
 */
function handleCodeFormSubmit(codeFormSubmitEvent) {
    codeFormSubmitEvent.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const code = elements.codeInput.value.trim().toUpperCase();
    const description = elements.descriptionInput.value.trim();
    const startTime = elements.startTimeInput.value;
    const endTime = elements.endTimeInput.value;
    const color = elements.colorInput.value;
    
    // Valider les entrées
    if (!code) {
        showToast('Le code ne peut pas être vide');
        return;
    }
    
    if (!description) {
        showToast('La description ne peut pas être vide');
        return;
    }
    
    // Vérifier si on modifie un code existant ou si on en crée un nouveau
    const isEditing = settingsState.currentEditingCode !== null;
    const oldCode = settingsState.currentEditingCode;
    
    // Si on crée un nouveau code et qu'il existe déjà
    if (!isEditing && settingsState.codes[code]) {
        showToast(`Le code "${code}" existe déjà`);
        return;
    }
    
    // Si on modifie un code et qu'on change son identifiant
    if (isEditing && oldCode !== code) {
        // Vérifier si le nouveau code existe déjà
        if (settingsState.codes[code]) {
            showToast(`Le code "${code}" existe déjà`);
            return;
        }
        
        // Supprimer l'ancien code
        delete settingsState.codes[oldCode];
    }
    
    // Mettre à jour ou créer le code
    settingsState.codes[code] = {
        description,
        startTime,
        endTime,
        color
    };
    
    // Sauvegarder les codes
    saveCodes();
    
    // Mettre à jour l'interface
    renderCodeList();
    resetCodeEditor();
    
    // Afficher un message de confirmation
    showToast(isEditing ? `Code "${code}" modifié avec succès` : `Code "${code}" ajouté avec succès`);
    
    // Déclencher un événement personnalisé pour informer l'application principale
    const codeUpdateEvent = new CustomEvent('codesUpdated', { 
        detail: { 
            action: isEditing ? 'update' : 'add',
            code: code,
            oldCode: isEditing ? oldCode : null,
            codeData: settingsState.codes[code]
        } 
    });
    document.dispatchEvent(codeUpdateEvent);
}

/**
 * Gère la suppression d'un code
 */
function handleDeleteCode() {
    const code = settingsState.currentEditingCode;
    if (!code) {
        showToast("Aucun code sélectionné pour la suppression");
        return;
    }
    
    // Demander confirmation
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le code "${code}" ?`)) {
        return;
    }
    
    // Supprimer le code
    delete settingsState.codes[code];
    
    // Sauvegarder les codes
    saveCodes();
    
    // Mettre à jour l'interface
    renderCodeList();
    resetCodeEditor();
    
    // Afficher un message de confirmation
    showToast(`Code "${code}" supprimé avec succès`);
    
    // Déclencher un événement personnalisé pour informer l'application principale
    const deleteEvent = new CustomEvent('codesUpdated', { 
        detail: { 
            action: 'delete',
            code: code
        } 
    });
    document.dispatchEvent(deleteEvent);
}

/**
 * Gère la soumission du formulaire d'API
 */
function handleApiFormSubmit(apiFormEvent) {
    apiFormEvent.preventDefault();
    
    console.log("Soumission du formulaire API");
    
    // Récupérer les valeurs du formulaire
    const apiKey = elements.apiKeyInput.value.trim();
    const model = elements.modelSelect.value;
    const strictMode = elements.strictModeCheckbox.checked;
    
    console.log("Paramètres API à sauvegarder:", {
        apiKeyPresent: !!apiKey,
        model,
        strictMode
    });
    
    // Mettre à jour les paramètres
    settingsState.apiSettings = {
        apiKey,
        model,
        strictMode
    };
    
    // Sauvegarder les paramètres
    saveApiSettings();
    
    // Afficher un message de confirmation
    showToast('Paramètres API enregistrés avec succès');
}

/**
 * Exporte les paramètres
 */
function exportSettings() {
    // Préparer les données à exporter
    const exportData = {
        codes: settingsState.codes,
        apiSettings: {
            model: settingsState.apiSettings.model,
            strictMode: settingsState.apiSettings.strictMode
            // Ne pas exporter la clé API pour des raisons de sécurité
        },
        exportDate: new Date().toISOString()
    };
    
    // Convertir en JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Créer un lien de téléchargement
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendrier-leo-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Afficher un message de confirmation
    showToast('Paramètres exportés avec succès');
}

/**
 * Importe les paramètres
 */
function importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Lire le fichier
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            // Parser le JSON
            const importData = JSON.parse(e.target.result);
            
            // Valider les données
            if (!importData.codes) {
                throw new Error('Le fichier ne contient pas de codes valides');
            }
            
            // Importer les codes
            settingsState.codes = importData.codes;
            saveCodes();
            
            // Importer les paramètres API (sauf la clé)
            if (importData.apiSettings && importData.apiSettings.model) {
                settingsState.apiSettings.model = importData.apiSettings.model;
                elements.modelSelect.value = importData.apiSettings.model;
                saveApiSettings();
            }
            
            // Mettre à jour l'interface
            renderCodeList();
            resetCodeEditor();
            
            // Afficher un message de confirmation
            showToast('Paramètres importés avec succès');
            
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            showToast('Erreur lors de l\'importation: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Réinitialiser l'input file
    event.target.value = '';
}

/**
 * Affiche un message toast
 */
function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.hidden = false;
    
    // Masquer le toast après 3 secondes
    setTimeout(() => {
        elements.toast.hidden = true;
    }, 3000);
}

// Initialiser les paramètres au chargement de la page
document.addEventListener('DOMContentLoaded', initSettings);
