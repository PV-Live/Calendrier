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
        model: 'mistral-ocr-medium'
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
    apiForm: document.getElementById('apiForm'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    modelSelect: document.getElementById('modelSelect'),
    
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
    // Recherche de codes
    elements.codeSearch.addEventListener('input', filterCodeList);
    
    // Ajout de code
    elements.addCodeBtn.addEventListener('click', () => {
        resetCodeEditor();
        elements.editorTitle.textContent = 'Ajouter un nouveau code';
        elements.deleteCodeBtn.style.display = 'none';
    });
    
    // Formulaire de code
    elements.codeForm.addEventListener('submit', handleCodeFormSubmit);
    elements.cancelEditBtn.addEventListener('click', resetCodeEditor);
    elements.deleteCodeBtn.addEventListener('click', handleDeleteCode);
    
    // Formulaire d'API
    elements.apiForm.addEventListener('submit', handleApiFormSubmit);
    
    // Import/Export
    elements.exportSettingsBtn.addEventListener('click', exportSettings);
    elements.importFileInput.addEventListener('change', importSettings);
}

/**
 * Charge les codes depuis le stockage local
 */
function loadCodes() {
    const savedCodes = localStorage.getItem('codeLegend');
    if (savedCodes) {
        try {
            settingsState.codes = JSON.parse(savedCodes);
        } catch (error) {
            console.error('Erreur lors du chargement des codes:', error);
            settingsState.codes = getDefaultCodes();
        }
    } else {
        // Codes par défaut
        settingsState.codes = getDefaultCodes();
        // Sauvegarder les codes par défaut
        saveCodes();
    }
}

/**
 * Retourne les codes par défaut
 */
function getDefaultCodes() {
    return {
        'JBD': {
            description: 'Jour de bureau - Domicile',
            startTime: '09:00',
            endTime: '17:00',
            color: '#4285f4'
        },
        'JBB': {
            description: 'Jour de bureau - Bureau',
            startTime: '09:00',
            endTime: '17:00',
            color: '#34a853'
        },
        'RH': {
            description: 'Ressources Humaines',
            startTime: '09:00',
            endTime: '17:00',
            color: '#ea4335'
        },
        'CP': {
            description: 'Congé Payé',
            startTime: '00:00',
            endTime: '23:59',
            color: '#fbbc05'
        },
        'M': {
            description: 'Maladie',
            startTime: '00:00',
            endTime: '23:59',
            color: '#ff6d01'
        },
        'F': {
            description: 'Formation',
            startTime: '09:00',
            endTime: '17:00',
            color: '#46bdc6'
        }
    };
}

/**
 * Sauvegarde les codes dans le stockage local
 */
function saveCodes() {
    localStorage.setItem('codeLegend', JSON.stringify(settingsState.codes));
}

/**
 * Charge les paramètres de l'API depuis le stockage local
 */
function loadApiSettings() {
    const savedSettings = localStorage.getItem('apiSettings');
    if (savedSettings) {
        try {
            settingsState.apiSettings = JSON.parse(savedSettings);
            elements.apiKeyInput.value = settingsState.apiSettings.apiKey || '';
            elements.modelSelect.value = settingsState.apiSettings.model || 'mistral-ocr-medium';
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API:', error);
        }
    }
}

/**
 * Sauvegarde les paramètres de l'API dans le stockage local
 */
function saveApiSettings() {
    localStorage.setItem('apiSettings', JSON.stringify(settingsState.apiSettings));
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
function handleCodeFormSubmit(event) {
    event.preventDefault();
    
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
}

/**
 * Gère la suppression d'un code
 */
function handleDeleteCode() {
    const code = settingsState.currentEditingCode;
    if (!code) return;
    
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
}

/**
 * Gère la soumission du formulaire d'API
 */
function handleApiFormSubmit(event) {
    event.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const apiKey = elements.apiKeyInput.value.trim();
    const model = elements.modelSelect.value;
    
    // Mettre à jour les paramètres
    settingsState.apiSettings = {
        apiKey,
        model
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
            model: settingsState.apiSettings.model
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
