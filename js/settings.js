/**
 * Normalise un code en le convertissant en majuscules
 * @param {string} code - Code à normaliser
 * @returns {string} - Code normalisé
 */
function normalizeCode(code) {
    return code ? code.toUpperCase() : code;
}

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
    exportableCheckbox: document.getElementById('exportableCheckbox'),
    overnightCheckbox: document.getElementById('overnightCheckbox'),
    saveCodeBtn: document.getElementById('saveCodeBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    deleteCodeBtn: document.getElementById('deleteCodeBtn'),
    
    // Configuration API
    apiSettingsForm: document.getElementById('apiSettingsForm'),
    apiKeyInput: document.getElementById('apiKeyInput'),
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
    
    // Écouteur pour le sélecteur de couleur
    elements.colorInput.addEventListener('input', updateColorPreview);
    
    // Configuration API
    elements.apiSettingsForm.addEventListener('submit', handleApiFormSubmit);
    
    // Import/Export
    elements.exportSettingsBtn.addEventListener('click', exportSettings);
    document.getElementById('importBtn').addEventListener('click', function() {
        elements.importFileInput.click();
    });
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
    console.log("Chargement des paramètres API");
    
    // Initialiser les paramètres par défaut
    settingsState.apiSettings = {
        apiKey: '',
        strictMode: true
    };
    
    // Essayer de charger depuis appSettings (méthode principale)
    const appSettingsJson = localStorage.getItem('appSettings');
    if (appSettingsJson) {
        try {
            const appSettings = JSON.parse(appSettingsJson);
            if (appSettings && appSettings.apiSettings) {
                settingsState.apiSettings.apiKey = appSettings.apiSettings.apiKey || '';
                settingsState.apiSettings.strictMode = appSettings.apiSettings.strictMode !== false;
                
                console.log("Paramètres API chargés depuis appSettings:", {
                    apiKeyPresent: !!settingsState.apiSettings.apiKey,
                    strictMode: settingsState.apiSettings.strictMode
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API depuis appSettings:', error);
        }
    }
    
    // Si aucune clé API n'est trouvée, essayer les méthodes de secours
    if (!settingsState.apiSettings.apiKey) {
        // Essayer de charger depuis apiSettings (ancienne méthode)
        const savedSettings = localStorage.getItem('apiSettings');
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                settingsState.apiSettings.apiKey = parsedSettings.apiKey || '';
                
                if (settingsState.apiSettings.apiKey) {
                    console.log("Clé API chargée depuis apiSettings (ancienne méthode)");
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la clé API:', error);
            }
        }
        
        // Essayer de charger depuis googleApiKey (nouvelle méthode)
        if (!settingsState.apiSettings.apiKey) {
            const directApiKey = localStorage.getItem('googleApiKey');
            if (directApiKey) {
                settingsState.apiSettings.apiKey = directApiKey;
                console.log("Clé API chargée depuis le stockage direct (nouvelle méthode)");
            }
        }
    }
    
    // Mettre à jour l'interface utilisateur
    if (elements.apiKeyInput) {
        elements.apiKeyInput.value = settingsState.apiSettings.apiKey;
    }
    
    if (elements.strictModeCheckbox) {
        elements.strictModeCheckbox.checked = settingsState.apiSettings.strictMode;
    }
    
    console.log("Chargement des paramètres API terminé");
}

/**
 * Sauvegarde les paramètres de l'API dans le stockage local
 */
function saveApiSettings(settings) {
    // Si des paramètres sont fournis, les utiliser
    if (settings) {
        settingsState.apiSettings.apiKey = settings.apiKey || settingsState.apiSettings.apiKey;
        settingsState.apiSettings.strictMode = settings.strictMode !== undefined ? settings.strictMode : settingsState.apiSettings.strictMode;
    }
    
    console.log("Début de la sauvegarde des paramètres API");
    console.log("Paramètres API à sauvegarder:", {
        apiKeyPresent: !!settingsState.apiSettings.apiKey,
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
    localStorage.setItem('googleApiKey', settingsState.apiSettings.apiKey);
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
            normalizeCode(code).toLowerCase().includes(searchTerm) || 
            settingsState.codes[code].description.toLowerCase().includes(searchTerm)
          )
        : sortedCodes;
    
    // Afficher chaque code
    if (filteredCodes.length === 0) {
        elements.codeList.innerHTML = '<div class="empty-state">Aucun code trouvé</div>';
    } else {
        filteredCodes.forEach(code => {
            // Normaliser le code pour l'affichage
            const normalizedCode = normalizeCode(code);
            const codeData = settingsState.codes[code];
            const codeItem = document.createElement('div');
            codeItem.className = 'code-item';
            
            // Ajouter la classe 'active' si c'est le code en cours d'édition
            if (normalizedCode === normalizeCode(settingsState.currentEditingCode)) {
                codeItem.classList.add('active');
            }
            
            codeItem.dataset.code = code;
            
            // Ajouter un indicateur de couleur
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.backgroundColor = codeData.color || '#4285f4';
            
            // Ajouter le code et sa description
            const codeText = document.createElement('div');
            codeText.className = 'code-text';
            
            const codeLabel = document.createElement('strong');
            codeLabel.textContent = normalizedCode;
            
            const codeDescription = document.createElement('span');
            codeDescription.textContent = codeData.description;
            
            codeText.appendChild(codeLabel);
            codeText.appendChild(document.createTextNode(' - '));
            codeText.appendChild(codeDescription);
            
            // Ajouter les heures
            const codeHours = document.createElement('div');
            codeHours.className = 'code-hours';
            codeHours.textContent = `${codeData.startTime} - ${codeData.endTime}`;
            
            // Ajouter l'indicateur d'exportation
            const exportIndicator = document.createElement('div');
            exportIndicator.className = codeData.exportable !== false ? 'export-indicator exportable' : 'export-indicator non-exportable';
            exportIndicator.innerHTML = codeData.exportable !== false ? '✓' : '✗';
            exportIndicator.title = codeData.exportable !== false ? 'Ce code sera exporté dans le calendrier' : 'Ce code ne sera pas exporté dans le calendrier';
            
            // Assembler l'élément
            codeItem.appendChild(colorIndicator);
            codeItem.appendChild(codeText);
            codeItem.appendChild(codeHours);
            codeItem.appendChild(exportIndicator);
            
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
 * @param {string} code - Code à éditer
 */
function editCode(code) {
    // Normaliser le code en majuscules
    const normalizedCode = normalizeCode(code);
    
    const codeData = settingsState.codes[normalizedCode];
    if (!codeData) return;
    
    // Mettre à jour l'état
    settingsState.currentEditingCode = normalizedCode;
    
    // Mettre à jour le titre
    elements.editorTitle.textContent = `Modifier le code "${normalizedCode}"`;
    
    // Remplir le formulaire
    elements.codeInput.value = normalizedCode;
    elements.codeInput.readOnly = true; // On ne peut pas modifier le code lui-même
    elements.descriptionInput.value = codeData.description || '';
    elements.startTimeInput.value = codeData.startTime || '09:00';
    elements.endTimeInput.value = codeData.endTime || '17:00';
    elements.colorInput.value = codeData.color || '#4285f4';
    elements.exportableCheckbox.checked = codeData.exportable !== false;
    elements.overnightCheckbox.checked = codeData.isOvernight;
    
    // Mettre à jour l'aperçu de la couleur
    updateColorPreview();
    
    // Afficher le bouton de suppression
    elements.deleteCodeBtn.style.display = 'block';
    
    // Mettre à jour la liste des codes pour mettre en évidence le code sélectionné
    renderCodeList();
}

/**
 * Réinitialise l'éditeur de code
 */
function resetCodeEditor() {
    // Réinitialiser le code en cours d'édition
    settingsState.currentEditingCode = null;
    
    // Mettre à jour le titre de l'éditeur
    elements.editorTitle.textContent = 'Ajouter un nouveau code';
    
    // Réinitialiser le formulaire
    elements.codeForm.reset();
    elements.codeInput.readOnly = false;
    elements.colorInput.value = '#6c5ce7'; // Couleur par défaut
    
    // Mettre à jour l'aperçu de la couleur
    updateColorPreview();
    
    // Masquer le bouton de suppression
    elements.deleteCodeBtn.style.display = 'none';
    
    // Mettre à jour la liste des codes
    renderCodeList();
}

/**
 * Met à jour l'aperçu de la couleur
 */
function updateColorPreview() {
    // Vérifier si l'élément d'aperçu existe déjà
    let colorPreview = document.querySelector('.color-preview');
    
    // Si non, le créer
    if (!colorPreview) {
        colorPreview = document.createElement('div');
        colorPreview.className = 'color-preview';
        elements.colorInput.parentNode.appendChild(colorPreview);
    }
    
    // Mettre à jour la couleur
    colorPreview.style.backgroundColor = elements.colorInput.value;
}

/**
 * Détermine si un code est un code de nuit en fonction de son nom et/ou de ses heures
 * @param {string} code - Le code à vérifier
 * @param {string} startTime - L'heure de début au format HH:MM
 * @param {string} endTime - L'heure de fin au format HH:MM
 * @returns {boolean} - True si c'est un code de nuit
 */
function isNightShift(code, startTime, endTime) {
    // Vérifier si le code commence par N (convention pour les codes de nuit)
    const codeStartsWithN = code.startsWith('N');
    
    // Vérifier si la description contient des mots-clés liés à la nuit
    const isNightInDescription = settingsState.currentEditingCode && 
                               settingsState.codes[settingsState.currentEditingCode] && 
                               settingsState.codes[settingsState.currentEditingCode].description && 
                               settingsState.codes[settingsState.currentEditingCode].description.toLowerCase().includes('nuit');
    
    // Vérifier les heures (si l'heure de début est après 18h et l'heure de fin avant 12h)
    let isNightHours = false;
    if (startTime && endTime) {
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        // Si l'heure de début est en soirée (après 18h) et l'heure de fin est le matin (avant 12h)
        isNightHours = (startHour >= 18 || startHour <= 3) && (endHour >= 4 && endHour <= 12);
    }
    
    // C'est un code de nuit si le code commence par N OU si les heures correspondent à un quart de nuit
    return codeStartsWithN || isNightInDescription || isNightHours;
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
    const exportable = elements.exportableCheckbox.checked;
    const isOvernight = elements.overnightCheckbox.checked;
    
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
    
    // Suggestion automatique pour les codes de nuit
    const autoDetectedNight = isNightShift(code, startTime, endTime);
    
    // Mettre à jour ou créer le code
    settingsState.codes[code] = {
        description,
        startTime,
        endTime,
        color,
        exportable,
        isOvernight
    };
    
    // Si c'est un code de nuit, afficher un message informatif
    if (isOvernight) {
        console.log(`Le code "${code}" a été configuré comme un code de nuit et sera affiché sur deux jours dans le calendrier exporté.`);
        showToast(`Le code "${code}" a été configuré comme un code de nuit`, "info");
    } else if (autoDetectedNight) {
        // Si le code a été détecté automatiquement comme un code de nuit mais que l'utilisateur ne l'a pas coché,
        // afficher un message de suggestion
        console.log(`Le code "${code}" a été détecté comme un possible code de nuit, mais n'a pas été configuré comme tel.`);
        showToast(`Le code "${code}" semble être un code de nuit. Vous pouvez activer l'option "Code de nuit" si nécessaire.`, "warning");
    }
    
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
 * @param {Event} apiFormEvent - Événement de soumission du formulaire
 */
function handleApiFormSubmit(apiFormEvent) {
    apiFormEvent.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const apiKey = elements.apiKeyInput.value.trim();
    
    // Le mode strict est toujours activé, même si l'élément de case à cocher a été supprimé
    const strictMode = true;
    
    console.log("Paramètres API à sauvegarder:", {
        apiKeyPresent: !!apiKey,
        strictMode
    });
    
    // Mettre à jour l'état
    settingsState.apiSettings = {
        apiKey,
        strictMode
    };
    
    // Sauvegarder les paramètres
    saveApiSettings();
    
    // Afficher un message de confirmation
    showToast("Paramètres API sauvegardés avec succès", "success");
}

/**
 * Exporte les paramètres
 */
function exportSettings() {
    // Préparer les données à exporter
    const exportData = {
        codes: settingsState.codes,
        apiSettings: {
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
            if (importData.apiSettings && importData.apiSettings.strictMode) {
                settingsState.apiSettings.strictMode = importData.apiSettings.strictMode;
                elements.strictModeCheckbox.checked = importData.apiSettings.strictMode;
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
function showToast(message, type) {
    elements.toastMessage.textContent = message;
    elements.toast.hidden = false;
    
    // Masquer le toast après 3 secondes
    setTimeout(() => {
        elements.toast.hidden = true;
    }, 3000);
}

// Initialiser les paramètres au chargement de la page
document.addEventListener('DOMContentLoaded', initSettings);
