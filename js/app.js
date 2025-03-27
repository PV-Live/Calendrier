/**
 * Calendrier Leo - Application principale
 * Gère l'interface utilisateur et les interactions
 */

// État de l'application
const appState = {
    imageFile: null,
    personName: '',
    month: new Date().getMonth() + 1, // Mois actuel (1-12)
    year: new Date().getFullYear(),
    results: null,
    isAnalyzing: false,
    codeLegend: {} // Légende des codes (sera chargée depuis le stockage local)
};

// Éléments DOM
const elements = {
    // Zones de fichiers
    dropArea: document.getElementById('dropArea'),
    fileInput: document.getElementById('fileInput'),
    previewContainer: document.getElementById('previewContainer'),
    imagePreview: document.getElementById('imagePreview'),
    removeImageBtn: document.getElementById('removeImage'),
    
    // Formulaire
    personNameInput: document.getElementById('personName'),
    monthSelect: document.getElementById('monthSelect'),
    yearInput: document.getElementById('yearInput'),
    analyzeButton: document.getElementById('analyzeButton'),
    
    // Résultats
    resultsSection: document.getElementById('resultsSection'),
    loader: document.getElementById('loader'),
    resultsContent: document.getElementById('resultsContent'),
    resultsTableBody: document.getElementById('resultsTableBody'),
    
    // Actions
    exportICSBtn: document.getElementById('exportICS'),
    exportJSONBtn: document.getElementById('exportJSON'),
    copyToClipboardBtn: document.getElementById('copyToClipboard'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

/**
 * Initialisation de l'application
 */
function initApp() {
    // Définir le mois et l'année actuels dans les champs
    elements.monthSelect.value = appState.month;
    elements.yearInput.value = appState.year;
    
    // Charger la légende des codes depuis le stockage local
    loadCodeLegend();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
}

/**
 * Configure tous les écouteurs d'événements
 */
function setupEventListeners() {
    // Gestion du glisser-déposer
    elements.dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropArea.classList.add('active');
    });
    
    elements.dropArea.addEventListener('dragleave', () => {
        elements.dropArea.classList.remove('active');
    });
    
    elements.dropArea.addEventListener('drop', handleFileDrop);
    
    // Sélection de fichier via le bouton
    elements.dropArea.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Suppression de l'image
    elements.removeImageBtn.addEventListener('click', removeImage);
    
    // Champs du formulaire
    elements.personNameInput.addEventListener('input', updateFormState);
    elements.monthSelect.addEventListener('change', updateFormState);
    elements.yearInput.addEventListener('input', updateFormState);
    
    // Bouton d'analyse
    elements.analyzeButton.addEventListener('click', analyzeImage);
    
    // Boutons d'export
    elements.exportICSBtn.addEventListener('click', exportToICS);
    elements.exportJSONBtn.addEventListener('click', exportToJSON);
    elements.copyToClipboardBtn.addEventListener('click', copyToClipboard);
}

/**
 * Gère le dépôt de fichier par glisser-déposer
 */
function handleFileDrop(e) {
    e.preventDefault();
    elements.dropArea.classList.remove('active');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

/**
 * Gère la sélection de fichier via l'input
 */
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

/**
 * Traite le fichier sélectionné
 */
function processFile(file) {
    // Vérifier que c'est une image
    if (!file.type.match('image.*')) {
        showToast('Veuillez sélectionner une image valide');
        return;
    }
    
    // Stocker le fichier
    appState.imageFile = file;
    
    // Afficher l'aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.imagePreview.src = e.target.result;
        elements.previewContainer.hidden = false;
        elements.dropArea.hidden = true;
    };
    reader.readAsDataURL(file);
    
    // Mettre à jour l'état du formulaire
    updateFormState();
}

/**
 * Supprime l'image sélectionnée
 */
function removeImage() {
    appState.imageFile = null;
    elements.imagePreview.src = '';
    elements.previewContainer.hidden = true;
    elements.dropArea.hidden = false;
    elements.fileInput.value = '';
    
    // Mettre à jour l'état du formulaire
    updateFormState();
}

/**
 * Met à jour l'état du formulaire et active/désactive le bouton d'analyse
 */
function updateFormState() {
    appState.personName = elements.personNameInput.value.trim();
    appState.month = parseInt(elements.monthSelect.value);
    appState.year = parseInt(elements.yearInput.value);
    
    // Activer le bouton d'analyse si tous les champs sont remplis
    const isFormValid = appState.imageFile && 
                        appState.personName && 
                        !isNaN(appState.month) && 
                        !isNaN(appState.year);
    
    elements.analyzeButton.disabled = !isFormValid || appState.isAnalyzing;
}

/**
 * Analyse l'image avec l'API Mistral OCR
 */
async function analyzeImage() {
    if (!appState.imageFile || appState.isAnalyzing) return;
    
    try {
        // Mettre à jour l'état
        appState.isAnalyzing = true;
        elements.analyzeButton.disabled = true;
        
        // Afficher le loader
        elements.resultsSection.hidden = false;
        elements.loader.hidden = false;
        elements.resultsContent.hidden = true;
        
        // Charger les paramètres API
        loadApiSettings();
        
        // Appeler l'API Mistral OCR
        const result = await analyzeImageWithMistralOCR(
            appState.imageFile,
            appState.personName
        );
        
        // Vérifier et corriger les codes par rapport à la légende
        const correctedResult = validateAndCorrectCodes(result);
        
        // Stocker les résultats
        appState.results = correctedResult;
        
        // Afficher les résultats
        displayResults(correctedResult);
        
        // Sauvegarder les résultats dans le stockage local
        saveResultsToLocalStorage(correctedResult);
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        showToast('Erreur lors de l\'analyse: ' + error.message);
    } finally {
        // Mettre à jour l'état
        appState.isAnalyzing = false;
        updateFormState();
        
        // Masquer le loader
        elements.loader.hidden = true;
    }
}

/**
 * Charge les paramètres API depuis le stockage local
 */
function loadApiSettings() {
    const savedSettings = localStorage.getItem('apiSettings');
    if (savedSettings) {
        try {
            const apiSettings = JSON.parse(savedSettings);
            // Mettre à jour la configuration de l'API Mistral
            if (apiSettings.apiKey) {
                MISTRAL_API_CONFIG.apiKey = apiSettings.apiKey;
            }
            if (apiSettings.model) {
                MISTRAL_API_CONFIG.model = apiSettings.model;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API:', error);
        }
    }
}

/**
 * Vérifie et corrige les codes par rapport à la légende
 */
function validateAndCorrectCodes(result) {
    if (!result || !result.days) return result;
    
    const correctedResult = {
        ...result,
        days: { ...result.days }
    };
    
    // Liste des codes connus (en majuscules)
    const knownCodes = Object.keys(appState.codeLegend).map(code => code.toUpperCase());
    
    // Vérifier chaque code
    Object.entries(correctedResult.days).forEach(([day, code]) => {
        if (!code) return; // Ignorer les jours sans code
        
        const upperCode = code.toUpperCase();
        
        // Si le code est déjà connu, le normaliser
        if (knownCodes.includes(upperCode)) {
            // Trouver le code avec la casse correcte
            const correctCode = knownCodes.find(c => c === upperCode);
            correctedResult.days[day] = correctCode;
            return;
        }
        
        // Chercher le code le plus proche
        let bestMatch = null;
        let bestScore = 0;
        
        knownCodes.forEach(knownCode => {
            const score = calculateSimilarity(upperCode, knownCode);
            if (score > bestScore && score > 0.7) { // Seuil de similarité de 70%
                bestScore = score;
                bestMatch = knownCode;
            }
        });
        
        // Si un code proche a été trouvé, le suggérer
        if (bestMatch) {
            console.log(`Code "${code}" corrigé en "${bestMatch}" (score: ${bestScore})`);
            correctedResult.days[day] = bestMatch;
        }
    });
    
    return correctedResult;
}

/**
 * Calcule la similarité entre deux chaînes (0-1)
 */
function calculateSimilarity(str1, str2) {
    // Pour les chaînes très courtes, utiliser une méthode simple
    if (str1.length <= 3 && str2.length <= 3) {
        // Compter les caractères communs
        const common = [...str1].filter(char => str2.includes(char)).length;
        return common / Math.max(str1.length, str2.length);
    }
    
    // Pour les chaînes plus longues, utiliser la distance de Levenshtein
    const m = str1.length;
    const n = str2.length;
    
    // Matrice de distance
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialiser la première ligne et colonne
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
    
    // Calculer la similarité (1 - distance normalisée)
    const maxLength = Math.max(m, n);
    return 1 - (d[m][n] / maxLength);
}

/**
 * Affiche les résultats dans le tableau
 */
function displayResults(results) {
    if (!results || !results.days) {
        showToast('Aucun résultat à afficher');
        return;
    }
    
    // Vider le tableau
    elements.resultsTableBody.innerHTML = '';
    
    // Ajouter chaque jour au tableau
    Object.entries(results.days).forEach(([day, code]) => {
        const row = document.createElement('tr');
        
        // Cellule du jour
        const dayCell = document.createElement('td');
        dayCell.textContent = day;
        row.appendChild(dayCell);
        
        // Cellule du code
        const codeCell = document.createElement('td');
        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.value = code;
        codeInput.dataset.day = day;
        codeInput.addEventListener('change', (e) => {
            // Mettre à jour le code dans les résultats
            results.days[day] = e.target.value;
            // Mettre à jour la description
            updateDescriptionCell(descriptionCell, e.target.value);
        });
        
        // Ajouter une liste déroulante des codes connus
        const codeSelect = document.createElement('datalist');
        codeSelect.id = `codes-${day}`;
        Object.keys(appState.codeLegend).forEach(knownCode => {
            const option = document.createElement('option');
            option.value = knownCode;
            codeSelect.appendChild(option);
        });
        codeInput.setAttribute('list', codeSelect.id);
        
        codeCell.appendChild(codeInput);
        codeCell.appendChild(codeSelect);
        row.appendChild(codeCell);
        
        // Cellule de description
        const descriptionCell = document.createElement('td');
        updateDescriptionCell(descriptionCell, code);
        row.appendChild(descriptionCell);
        
        // Ajouter la ligne au tableau
        elements.resultsTableBody.appendChild(row);
    });
    
    // Afficher la section des résultats
    elements.resultsContent.hidden = false;
}

/**
 * Met à jour la cellule de description avec la description du code
 */
function updateDescriptionCell(cell, code) {
    if (!code) {
        cell.textContent = '';
        cell.style.backgroundColor = '';
        return;
    }
    
    const codeData = appState.codeLegend[code];
    
    if (codeData) {
        // Afficher la description et les heures
        cell.textContent = `${codeData.description} (${codeData.startTime} - ${codeData.endTime})`;
        
        // Appliquer la couleur de fond
        if (codeData.color) {
            // Utiliser une version plus claire de la couleur
            const color = codeData.color + '33'; // Ajouter 20% d'opacité
            cell.style.backgroundColor = color;
        } else {
            cell.style.backgroundColor = '';
        }
    } else {
        cell.textContent = 'Code inconnu';
        cell.style.backgroundColor = '';
    }
}

/**
 * Exporte les résultats au format ICS (iCalendar)
 */
function exportToICS() {
    if (!appState.results || !appState.results.days) {
        showToast('Aucun résultat à exporter');
        return;
    }
    
    const calendar = createICSCalendar(
        appState.results.days,
        appState.personName,
        appState.month,
        appState.year,
        appState.codeLegend
    );
    
    // Créer un lien de téléchargement
    const blob = new Blob([calendar], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendrier_${appState.personName}_${appState.month}_${appState.year}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Calendrier exporté avec succès');
}

/**
 * Exporte les résultats au format JSON
 */
function exportToJSON() {
    if (!appState.results || !appState.results.days) {
        showToast('Aucun résultat à exporter');
        return;
    }
    
    const jsonData = JSON.stringify({
        person: appState.personName,
        month: appState.month,
        year: appState.year,
        days: appState.results.days
    }, null, 2);
    
    // Créer un lien de téléchargement
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendrier_${appState.personName}_${appState.month}_${appState.year}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('JSON exporté avec succès');
}

/**
 * Copie les résultats au format JSON dans le presse-papier
 */
function copyToClipboard() {
    if (!appState.results || !appState.results.days) {
        showToast('Aucun résultat à copier');
        return;
    }
    
    const jsonData = JSON.stringify({
        person: appState.personName,
        month: appState.month,
        year: appState.year,
        days: appState.results.days
    }, null, 2);
    
    navigator.clipboard.writeText(jsonData)
        .then(() => {
            showToast('Résultats copiés dans le presse-papier');
        })
        .catch(err => {
            console.error('Erreur lors de la copie:', err);
            showToast('Erreur lors de la copie');
        });
}

/**
 * Charge la légende des codes depuis le stockage local
 */
function loadCodeLegend() {
    const savedLegend = localStorage.getItem('codeLegend');
    if (savedLegend) {
        try {
            appState.codeLegend = JSON.parse(savedLegend);
        } catch (error) {
            console.error('Erreur lors du chargement de la légende:', error);
            appState.codeLegend = getDefaultCodeLegend();
        }
    } else {
        // Légende par défaut
        appState.codeLegend = getDefaultCodeLegend();
        // Sauvegarder la légende par défaut
        localStorage.setItem('codeLegend', JSON.stringify(appState.codeLegend));
    }
}

/**
 * Retourne la légende des codes par défaut
 */
function getDefaultCodeLegend() {
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
 * Sauvegarde les résultats dans le stockage local
 */
function saveResultsToLocalStorage(results) {
    const key = `results_${appState.personName}_${appState.month}_${appState.year}`;
    localStorage.setItem(key, JSON.stringify(results));
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

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', initApp);
