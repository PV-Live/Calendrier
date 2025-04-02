/**
 * codes.js
 * Gestion des codes pour l'application Calendrier CHAL
 */

/**
 * Vérifie si un code est valide
 * @param {string} str - Code à vérifier
 * @returns {boolean} - True si le code est valide
 */
function isValidCode(str) {
    if (!str) return false;
    
    // Vérifier si le code est dans la liste des codes valides
    if (appState.validCodes && appState.validCodes.length > 0) {
        return appState.validCodes.includes(str.trim().toUpperCase());
    }
    
    // Si aucune liste de codes valides n'est définie, accepter tous les codes non vides
    return str.trim() !== '';
}

/**
 * Charge les codes depuis les paramètres de l'application
 * @returns {Object|null} - Codes chargés ou null si aucun code n'est trouvé
 */
function loadCodesFromSettings() {
    const appSettingsJson = localStorage.getItem('appSettings');
    
    if (appSettingsJson) {
        try {
            const appSettings = JSON.parse(appSettingsJson);
            if (appSettings && appSettings.codes && Object.keys(appSettings.codes).length > 0) {
                return appSettings.codes;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des codes depuis les paramètres:', error);
        }
    }
    
    return null;
}

/**
 * Charge les codes depuis un fichier JSON
 * @returns {Promise<Object|null>} - Codes chargés ou null si aucun code n'est trouvé
 */
async function loadCodesFromJsonFile() {
    try {
        const response = await fetch('calendrier-chal-settings.json');
        
        if (!response.ok) {
            throw new Error('Fichier de paramètres non trouvé');
        }
        
        const data = await response.json();
        
        if (data && data.codes && Object.keys(data.codes).length > 0) {
            return data.codes;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des codes depuis le fichier JSON:', error);
    }
    
    return null;
}

/**
 * Sauvegarde les codes dans les paramètres de l'application
 * @param {Object} codes - Codes à sauvegarder
 */
function saveCodesInAppSettings(codes) {
    if (!codes) return;
    
    const appSettingsJson = localStorage.getItem('appSettings');
    let appSettings = {};
    
    if (appSettingsJson) {
        try {
            appSettings = JSON.parse(appSettingsJson);
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        }
    }
    
    appSettings.codes = codes;
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
}

/**
 * Retourne les codes par défaut
 * @returns {Object} - Codes par défaut
 */
function getDefaultCodes() {
    return {
        "C9E": {
            "description": "Congé",
            "color": "#4CAF50",
            "hours": 0
        },
        "RH": {
            "description": "Repos Hebdomadaire",
            "color": "#2196F3",
            "hours": 0
        },
        "JRD": {
            "description": "Journée Régulière de Disponibilité",
            "color": "#FFC107",
            "hours": 8
        },
        "M7M": {
            "description": "Matin 7h",
            "color": "#9C27B0",
            "hours": 7
        },
        "S7M": {
            "description": "Soir 7h",
            "color": "#FF5722",
            "hours": 7
        },
        "N10M": {
            "description": "Nuit 10h",
            "color": "#607D8B",
            "hours": 10
        },
        "J8M": {
            "description": "Jour 8h",
            "color": "#E91E63",
            "hours": 8
        },
        "J10M": {
            "description": "Jour 10h",
            "color": "#673AB7",
            "hours": 10
        },
        "J12M": {
            "description": "Jour 12h",
            "color": "#3F51B5",
            "hours": 12
        },
        "N12M": {
            "description": "Nuit 12h",
            "color": "#009688",
            "hours": 12
        }
    };
}

/**
 * Charge les codes depuis différentes sources
 * @returns {Promise<void>}
 */
async function loadCodes() {
    // Essayer de charger les codes depuis les paramètres de l'application
    let codes = loadCodesFromSettings();
    
    // Si aucun code n'est trouvé, essayer de charger depuis le fichier JSON
    if (!codes) {
        codes = await loadCodesFromJsonFile();
    }
    
    // Si aucun code n'est trouvé, utiliser les codes par défaut
    if (!codes) {
        codes = getDefaultCodes();
        
        // Sauvegarder les codes par défaut dans les paramètres
        saveCodesInAppSettings(codes);
    }
    
    // Mettre à jour l'état de l'application
    appState.codesData = codes;
    appState.validCodes = Object.keys(codes);
}

/**
 * Met à jour les listes déroulantes de codes
 */
function updateCodeDropdowns() {
    if (!elements.codeDropdowns) return;
    
    elements.codeDropdowns.forEach(dropdown => {
        // Sauvegarder la valeur actuelle
        const currentValue = dropdown.value;
        
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
        
        // Restaurer la valeur
        if (currentValue && appState.validCodes.includes(currentValue)) {
            dropdown.value = currentValue;
        }
    });
}

/**
 * Retourne la description d'un code
 * @param {string} code - Code
 * @returns {string} - Description du code
 */
function getCodeDescription(code) {
    if (!code) return '';
    
    const codeData = appState.codesData[code];
    return codeData ? codeData.description : '';
}

/**
 * Retourne la couleur d'un code
 * @param {string} code - Code
 * @returns {string} - Couleur du code
 */
function getCodeColor(code) {
    if (!code) return '#CCCCCC';
    
    const codeData = appState.codesData[code];
    return codeData && codeData.color ? codeData.color : '#CCCCCC';
}

/**
 * Retourne le nombre d'heures d'un code
 * @param {string} code - Code
 * @returns {number} - Nombre d'heures
 */
function getCodeHours(code) {
    if (!code) return 0;
    
    const codeData = appState.codesData[code];
    return codeData && typeof codeData.hours === 'number' ? codeData.hours : 0;
}

/**
 * Crée la légende des codes
 * @returns {HTMLElement} - Élément HTML contenant la légende
 */
function createCodeLegend() {
    const container = document.createElement('div');
    container.className = 'code-legend-items';
    
    // Trier les codes par ordre alphabétique
    const sortedCodes = [...appState.validCodes].sort();
    
    sortedCodes.forEach(code => {
        const item = document.createElement('div');
        item.className = 'code-legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'code-color';
        colorBox.style.backgroundColor = getCodeColor(code);
        
        const codeText = document.createElement('div');
        codeText.className = 'code-text';
        codeText.textContent = code;
        
        const codeDesc = document.createElement('div');
        codeDesc.className = 'code-description';
        codeDesc.textContent = getCodeDescription(code);
        
        const codeHours = document.createElement('div');
        codeHours.className = 'code-hours';
        codeHours.textContent = `${getCodeHours(code)}h`;
        
        item.appendChild(colorBox);
        item.appendChild(codeText);
        item.appendChild(codeDesc);
        item.appendChild(codeHours);
        
        container.appendChild(item);
    });
    
    return container;
}

/**
 * Calcule la similarité entre deux chaînes de caractères
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Score de similarité (0-1)
 */
function calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Normaliser les chaînes
    str1 = str1.trim().toUpperCase();
    str2 = str2.trim().toUpperCase();
    
    // Calculer la distance de Levenshtein
    const distance = levenshteinDistance(str1, str2);
    
    // Calculer la similarité
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength > 0 ? 1 - distance / maxLength : 1;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Distance de Levenshtein
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    
    // Créer la matrice
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialiser la première colonne et la première ligne
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    
    // Remplir la matrice
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // Suppression
                d[i][j - 1] + 1,      // Insertion
                d[i - 1][j - 1] + cost // Substitution
            );
        }
    }
    
    return d[m][n];
}

/**
 * Trouve le code le plus similaire dans une liste de codes valides
 * @param {string} code - Code à comparer
 * @param {string[]} validCodes - Liste des codes valides
 * @param {number} threshold - Seuil de similarité (0-1)
 * @returns {string|null} - Code le plus similaire ou null si aucun code ne dépasse le seuil
 */
function findMostSimilarCode(code, validCodes, threshold = 0.5) {
    if (!code || !validCodes || validCodes.length === 0) {
        return null;
    }
    
    // Normaliser le code
    code = code.trim().toUpperCase();
    
    let maxSimilarity = 0;
    let mostSimilarCode = null;
    
    for (const validCode of validCodes) {
        const similarity = calculateStringSimilarity(code, validCode);
        
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            mostSimilarCode = validCode;
        }
    }
    
    // Retourner le code le plus similaire si la similarité dépasse le seuil
    if (maxSimilarity >= threshold) {
        return mostSimilarCode;
    }
    
    return null;
}

/**
 * Charge les paramètres API depuis le stockage local
 * @returns {Promise<void>}
 */
async function loadApiSettings() {
    // Essayer de charger depuis appSettings (nouvelle méthode)
    const appSettingsJson = localStorage.getItem('appSettings');
    
    if (appSettingsJson) {
        try {
            const appSettings = JSON.parse(appSettingsJson);
            
            if (appSettings && appSettings.apiSettings) {
                appState.apiSettings = {
                    ...appState.apiSettings,
                    ...appSettings.apiSettings
                };
                
                console.log("Paramètres API chargés depuis appSettings");
                return;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API:', error);
        }
    }
    
    // Essayer de charger depuis apiSettings (ancienne méthode)
    const savedSettings = localStorage.getItem('apiSettings');
    
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            
            if (parsedSettings) {
                // Mettre à jour les paramètres API
                appState.apiSettings = {
                    ...appState.apiSettings,
                    apiKey: parsedSettings.apiKey || '',
                    model: parsedSettings.model || 'mistral-ocr-latest',
                    strictMode: parsedSettings.strictMode !== false
                };
                
                // Sauvegarder dans le nouveau format
                saveApiSettings(appState.apiSettings);
                
                console.log("Paramètres API chargés depuis apiSettings (ancienne méthode) et migrés");
                return;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API (ancienne méthode):', error);
        }
    }
    
    // Essayer de charger depuis mistralApiKey (ancienne méthode)
    const directApiKey = localStorage.getItem('mistralApiKey');
    
    if (directApiKey) {
        // Mettre à jour les paramètres API
        appState.apiSettings.apiKey = directApiKey;
        
        // Sauvegarder dans le nouveau format
        saveApiSettings(appState.apiSettings);
        
        console.log("Paramètres API chargés depuis le stockage direct (ancienne méthode) et migrés");
    }
}

/**
 * Sauvegarde les paramètres API dans le stockage local
 * @param {Object} apiSettings - Paramètres API
 */
function saveApiSettings(apiSettings) {
    if (!apiSettings) return;
    
    // Mettre à jour l'état de l'application
    appState.apiSettings = {
        ...appState.apiSettings,
        ...apiSettings
    };
    
    // Sauvegarder dans appSettings
    const appSettingsJson = localStorage.getItem('appSettings');
    let appSettings = {};
    
    if (appSettingsJson) {
        try {
            appSettings = JSON.parse(appSettingsJson);
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        }
    }
    
    appSettings.apiSettings = appState.apiSettings;
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    
    console.log("Paramètres API sauvegardés:", appState.apiSettings);
}

// Exposer les fonctions au niveau global
window.isValidCode = isValidCode;
window.loadCodes = loadCodes;
window.updateCodeDropdowns = updateCodeDropdowns;
window.getCodeDescription = getCodeDescription;
window.getCodeColor = getCodeColor;
window.getCodeHours = getCodeHours;
window.createCodeLegend = createCodeLegend;
window.calculateStringSimilarity = calculateStringSimilarity;
window.findMostSimilarCode = findMostSimilarCode;
window.loadApiSettings = loadApiSettings;
window.saveApiSettings = saveApiSettings;
