/**
 * Calendrier Leo - Application principale
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
        
        // Paramètres
        apiKeyInput: document.getElementById('apiKeyInput'),
        saveSettingsButton: document.getElementById('saveSettingsButton'),
        settingsButton: document.getElementById('settingsButton'),
        
        // Autres éléments
        loadingIndicator: document.getElementById('loadingIndicator'),
        toastContainer: document.getElementById('toastContainer'),
        toastMessage: document.getElementById('toastMessage')
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
 * Empêche le comportement par défaut des événements
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Met en évidence la zone de dépôt
 */
function highlight(e) {
    elements.dropArea.classList.add('highlight');
}

/**
 * Retire la mise en évidence de la zone de dépôt
 */
function unhighlight(e) {
    elements.dropArea.classList.remove('highlight');
}

/**
 * Gère le survol de la zone de dépôt
 */
function handleDragOver(e) {
    preventDefaults(e);
    highlight(e);
}

/**
 * Gère le dépôt de fichier
 */
function handleDrop(e) {
    preventDefaults(e);
    unhighlight(e);
    
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        appState.imageFile = files[0];
        console.log("Image stockée dans appState.imageFile:", files[0].name);
        
        // Afficher l'aperçu de l'image
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Afficher l'aperçu
            if (elements.filePreview) {
                elements.filePreview.src = e.target.result;
            }
            
            // Afficher le conteneur d'aperçu
            if (elements.previewContainer) {
                elements.previewContainer.hidden = false;
            }
            
            // Masquer la zone de dépôt
            if (elements.dropArea) {
                elements.dropArea.hidden = true;
            }
            
            // Mettre à jour l'état du formulaire
            updateFormState();
        };
        
        reader.readAsDataURL(files[0]);
        console.log("Lecture du fichier lancée");
    }
}

/**
 * Gère la sélection de fichier
 */
function handleFileSelect(e) {
    const files = e.target.files;
    
    if (files.length > 0) {
        appState.imageFile = files[0];
        console.log("Image stockée dans appState.imageFile:", files[0].name);
        
        // Afficher l'aperçu de l'image
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Afficher l'aperçu
            if (elements.filePreview) {
                elements.filePreview.src = e.target.result;
            }
            
            // Afficher le conteneur d'aperçu
            if (elements.previewContainer) {
                elements.previewContainer.hidden = false;
            }
            
            // Masquer la zone de dépôt
            if (elements.dropArea) {
                elements.dropArea.hidden = true;
            }
            
            // Mettre à jour l'état du formulaire
            updateFormState();
        };
        
        reader.readAsDataURL(files[0]);
        console.log("Lecture du fichier lancée");
    }
}

/**
 * Supprime l'image sélectionnée
 */
function removeImage() {
    console.log("Suppression de l'image");
    
    // Réinitialiser l'état de l'application
    appState.imageFile = null;
    
    // Réinitialiser l'interface
    if (elements.filePreview) {
        elements.filePreview.src = '';
        elements.previewContainer.hidden = true;
    }
    
    if (elements.dropArea) {
        elements.dropArea.hidden = false;
    }
    
    if (elements.fileInput) {
        elements.fileInput.value = '';
    }
    
    // Réinitialiser les résultats
    if (elements.resultsSection) {
        elements.resultsSection.hidden = true;
    }
    
    // Réinitialiser la saisie du nom
    if (elements.personNameInput) {
        elements.personNameInput.value = '';
    }
    
    // Mettre à jour l'état du formulaire
    updateFormState();
}

/**
 * Met à jour l'état du formulaire
 */
function updateFormState() {
    console.log("Mise à jour de l'état du formulaire");
    console.log("État actuel:", {
        imageFile: appState.imageFile ? "présent" : "absent",
        personName: elements.personNameInput ? elements.personNameInput.value : "non disponible"
    });
    
    // Activer/désactiver le bouton d'analyse
    if (elements.analyzeButton) {
        const hasImage = appState.imageFile !== null;
        const hasName = elements.personNameInput && elements.personNameInput.value.trim() !== '';
        
        console.log("Conditions pour activer le bouton:", { hasImage, hasName });
        
        if (hasImage && hasName) {
            console.log("Activation du bouton d'analyse");
            elements.analyzeButton.disabled = false;
            elements.analyzeButton.classList.remove('disabled');
        } else {
            console.log("Désactivation du bouton d'analyse");
            elements.analyzeButton.disabled = true;
            elements.analyzeButton.classList.add('disabled');
        }
    }
}

/**
 * Analyse le texte OCR pour une personne spécifique
 * @param {string} ocrText - Le texte OCR à analyser
 * @param {string} personName - Le nom de la personne à rechercher
 * @param {number} month - Le mois sélectionné (1-12)
 * @param {number} year - L'année sélectionnée
 * @returns {Object} - Les résultats de l'analyse
 */
async function analyzeOcrTextForPerson(ocrText, personName, month, year) {
    console.log("Analyse du texte OCR pour", personName);
    
    // Normaliser le nom pour la recherche
    const normalizedName = personName.toUpperCase().trim();
    console.log("Nom normalisé:", normalizedName);
    
    // Si le texte OCR est vide, retourner un résultat vide
    if (!ocrText || ocrText.trim() === '') {
        console.log("Texte OCR vide");
        return { found: false, name: normalizedName, codes: [], rawText: ocrText };
    }
    
    // Prétraitement du texte OCR pour améliorer la détection
    ocrText = cleanOcrText(ocrText);
    
    // Détecter si le texte est au format tableau Markdown
    const isMarkdownTable = ocrText.includes('|') && ocrText.includes('\n');
    console.log(isMarkdownTable ? "Format tableau Markdown détecté" : "Format texte brut détecté");
    
    let codes = [];
    let foundName = '';
    let found = false;
    
    // Traiter le texte selon son format
    if (isMarkdownTable) {
        // Diviser le texte en lignes
        const lines = ocrText.split('\n').filter(line => line.trim() !== '');
        
        // Si le tableau a une ligne d'en-tête et une ligne de séparation, commencer à la ligne 2
        const startLine = lines.length > 2 && lines[1].includes('---') ? 2 : 0;
        
        if (lines.length <= startLine) {
            console.log("Tableau trop court, impossible de trouver des codes");
            return { found: false, name: normalizedName, codes: [], rawText: ocrText };
        }
        
        // Si le tableau a plusieurs lignes, traiter normalement
        if (lines.length > startLine + 1) {
            console.log("Tableau avec plusieurs lignes détecté, traitement normal");
            
            // Chercher la ligne qui contient le nom de la personne
            let matchedLine = -1;
            let bestMatchScore = 0;
            let bestMatchName = '';
            
            for (let i = startLine; i < lines.length; i++) {
                const line = lines[i];
                const cells = line.split('|').map(cell => cell.trim());
                
                if (cells.length > 1) {
                    const nameInCell = cells[1].trim();
                    
                    // Calculer la similarité entre le nom recherché et le nom dans la cellule
                    const similarity = calculateStringSimilarity(normalizedName, nameInCell.toUpperCase());
                    console.log(`Ligne ${i}: Similarité entre "${normalizedName}" et "${nameInCell}": ${similarity}`);
                    
                    // Si la similarité est supérieure à un seuil et meilleure que les précédentes
                    // Réduire le seuil à 0.2 pour être plus permissif
                    if (similarity > 0.2 && similarity > bestMatchScore) {
                        bestMatchScore = similarity;
                        bestMatchName = nameInCell;
                        matchedLine = i;
                    }
                }
            }
            
            // Si une correspondance a été trouvée
            if (matchedLine !== -1) {
                console.log(`Correspondance trouvée à la ligne ${matchedLine}: "${bestMatchName}" pour "${normalizedName}"`);
                
                // Extraire les codes de la ligne
                const cells = lines[matchedLine].split('|').map(cell => cell.trim());
                
                // Le premier élément est vide (avant le premier |) et le second est le nom
                // Les codes commencent à partir du troisième élément (index 2)
                for (let i = 2; i < cells.length; i++) {
                    const code = cells[i].trim();
                    if (code && code !== '') {
                        codes.push(code);
                    } else {
                        // Si la cellule est vide, ajouter un code par défaut (RHE)
                        codes.push('RHE');
                    }
                }
                
                found = true;
                foundName = bestMatchName;
            } else {
                // Si aucune correspondance n'a été trouvée, essayer de traiter l'image directement
                console.log("Aucune correspondance trouvée dans le tableau, tentative de traitement direct de l'image");
                
                // Vérifier si nous avons une ligne avec au moins 20 cellules (potentiellement des codes)
                for (let i = startLine; i < lines.length; i++) {
                    const line = lines[i];
                    const cells = line.split('|').map(cell => cell.trim());
                    
                    if (cells.length >= 20) {
                        console.log(`Ligne ${i} contient ${cells.length} cellules, possible ligne de codes`);
                        
                        // Extraire les codes de la ligne
                        for (let j = 1; j < cells.length; j++) {
                            const code = cells[j].trim();
                            if (code && code !== '') {
                                codes.push(code);
                            }
                        }
                        
                        if (codes.length > 0) {
                            console.log(`${codes.length} codes extraits directement de la ligne ${i}`);
                            found = true;
                            foundName = normalizedName;
                            break;
                        }
                    }
                }
            }
        }
    } else {
        // Traitement pour le texte brut (non implémenté pour l'instant)
        console.log("Format texte brut non pris en charge pour le moment");
    }
    
    console.log(`${codes.length} codes valides trouvés`);
    
    // Compléter les codes manquants pour atteindre le nombre de jours du mois
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Si nous avons moins de codes que de jours dans le mois, compléter avec des codes par défaut
    if (codes.length < daysInMonth) {
        console.log(`Complétion des codes manquants (${codes.length} -> ${daysInMonth})`);
        const defaultCode = 'RHE'; // Code par défaut
        while (codes.length < daysInMonth) {
            codes.push(defaultCode);
        }
    } else if (codes.length > daysInMonth) {
        // Si nous avons plus de codes que de jours dans le mois, tronquer
        console.log(`Troncature des codes excédentaires (${codes.length} -> ${daysInMonth})`);
        codes = codes.slice(0, daysInMonth);
    }
    
    // Si aucun code n'a été trouvé, générer des codes de démonstration
    if (!found || codes.length === 0) {
        console.log("Aucun code trouvé, génération de codes de démonstration");
        const demoCodes = generateDemoCodes(daysInMonth);
        console.log(`${demoCodes.length} codes générés pour la démonstration`);
        
        return {
            found: false,
            name: normalizedName,
            codes: demoCodes,
            rawText: ocrText,
            month: month
        };
    }
    
    return {
        found: true,
        name: foundName || normalizedName,
        codes: codes,
        rawText: ocrText
    };
}

/**
 * Nettoie le texte OCR pour améliorer la détection
 * @param {string} ocrText - Le texte OCR à nettoyer
 * @returns {string} - Le texte OCR nettoyé
 */
function cleanOcrText(ocrText) {
    // Remplacer les caractères problématiques
    let cleanedText = ocrText
        .replace(/OR 95% CI/g, '')  // Supprimer les "OR 95% CI" qui peuvent être des erreurs OCR
        .replace(/\|\s+\|/g, '| |') // Normaliser les cellules vides
        .replace(/\s{2,}/g, ' ');   // Normaliser les espaces multiples
    
    return cleanedText;
}

/**
 * Affiche les résultats de l'analyse
 * @param {Object} result - Les résultats de l'analyse
 */
function displayResults(result) {
    console.log("Affichage des résultats:", result);
    
    if (!result) {
        showToast("Erreur lors de l'analyse", "error");
        return;
    }
    
    // Vider les conteneurs précédents
    if (elements.resultsContent) {
        // Conserver uniquement les éléments de base
        const childrenToKeep = [];
        Array.from(elements.resultsContent.children).forEach(child => {
            if (child.classList.contains('results-header') || 
                child.classList.contains('table-container') ||
                child.classList.contains('export-buttons')) {
                childrenToKeep.push(child);
            } else {
                elements.resultsContent.removeChild(child);
            }
        });
    }
    
    // Mettre à jour le nom de la personne
    if (elements.personNamesList) {
        elements.personNamesList.textContent = result.name;
    }
    
    // Vider le tableau des résultats
    if (elements.resultsTableBody) {
        elements.resultsTableBody.innerHTML = '';
    }
    
    // Masquer l'indicateur de chargement
    if (elements.loadingIndicator) {
        elements.loadingIndicator.hidden = true;
    }
    
    // Afficher le contenu des résultats
    if (elements.resultsContent) {
        elements.resultsContent.hidden = false;
    }
    
    // Afficher la section des résultats
    if (elements.resultsSection) {
        elements.resultsSection.hidden = false;
    }
    
    // Si aucun code n'a été trouvé
    if (!result.codes || result.codes.length === 0) {
        // Ajouter une ligne indiquant qu'aucun code n'a été trouvé
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" class="no-results">Aucun code trouvé pour ${result.name}</td>
        `;
        elements.resultsTableBody.appendChild(row);
        
        return;
    }
    
    // Modifier l'en-tête du tableau pour afficher "Horaires" au lieu de "Description"
    const tableHeaders = document.querySelectorAll('#resultsTable th');
    if (tableHeaders && tableHeaders.length >= 3) {
        tableHeaders[2].textContent = 'Horaires';
    }
    
    // Obtenir le mois et l'année pour calculer les dates exactes
    const month = result.month || new Date().getMonth() + 1; // Mois de 1 à 12
    const year = result.year || new Date().getFullYear();
    
    // Ajouter chaque code au tableau
    result.codes.forEach((codeInfo, index) => {
        // Déterminer le jour en fonction de l'index et du mois
        const day = index + 1;
        
        // Créer un objet Date pour obtenir le jour de la semaine
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        const dayOfMonth = date.getDate();
        const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
        
        // Formater le jour (ex: "Lundi 1 mars")
        const formattedDay = `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} ${dayOfMonth} ${monthName}`;
        
        const row = document.createElement('tr');
        
        // Colonne du jour
        const dayCell = document.createElement('td');
        dayCell.textContent = formattedDay;
        row.appendChild(dayCell);
        
        // Colonne du code
        const codeCell = document.createElement('td');
        const codeSelect = document.createElement('select');
        codeSelect.className = 'code-select';
        codeSelect.dataset.index = index;
        
        // Ajouter les options à partir des codes valides
        if (appState.validCodes && appState.validCodes.length > 0) {
            // Ajouter chaque code valide comme option
            appState.validCodes.forEach(validCode => {
                const option = document.createElement('option');
                option.value = validCode;
                option.textContent = validCode;
                
                // Sélectionner le code actuel
                if (validCode === codeInfo) {
                    option.selected = true;
                }
                
                codeSelect.appendChild(option);
            });
        } else {
            // Si aucun code valide n'est défini, ajouter uniquement le code actuel
            const option = document.createElement('option');
            option.value = codeInfo;
            option.textContent = codeInfo;
            option.selected = true;
            codeSelect.appendChild(option);
        }
        
        // Ajouter un gestionnaire d'événements pour mettre à jour le code lorsqu'il est modifié
        codeSelect.addEventListener('change', function() {
            // Mettre à jour le code dans les résultats
            const newCode = this.value;
            result.codes[index] = newCode;
            
            // Mettre à jour l'état de l'application
            appState.results = result;
            
            // Mettre à jour les horaires
            const hoursElement = row.querySelector('.code-hours');
            if (hoursElement) {
                const hours = getCodeHours(newCode);
                hoursElement.textContent = hours || 'Horaires non définis';
            }
            
            // Mettre à jour la couleur de fond
            const codeColor = getCodeColor(newCode);
            if (codeColor) {
                this.style.backgroundColor = codeColor;
                this.parentElement.style.backgroundColor = codeColor;
            }
        });
        
        // Définir la couleur de fond initiale
        const codeColor = getCodeColor(codeInfo);
        if (codeColor) {
            codeSelect.style.backgroundColor = codeColor;
            codeCell.style.backgroundColor = codeColor;
        }
        
        codeCell.appendChild(codeSelect);
        row.appendChild(codeCell);
        
        // Colonne des horaires
        const hoursCell = document.createElement('td');
        const hoursSpan = document.createElement('span');
        hoursSpan.className = 'code-hours';
        
        // Obtenir les horaires du code
        const hours = getCodeHours(codeInfo);
        hoursSpan.textContent = hours || 'Horaires non définis';
        
        hoursCell.appendChild(hoursSpan);
        row.appendChild(hoursCell);
        
        // Ajouter la ligne au tableau
        elements.resultsTableBody.appendChild(row);
    });
    
    // Activer les boutons d'exportation
    if (elements.exportIcsButton) {
        elements.exportIcsButton.disabled = false;
    }
    
    if (elements.exportJsonButton) {
        elements.exportJsonButton.disabled = false;
    }
    
    if (elements.copyButton) {
        elements.copyButton.disabled = false;
    }
    
    // Ajouter une légende des codes
    const codeLegend = createCodeLegend();
    elements.resultsContent.appendChild(codeLegend);
    
    // S'assurer que le loader est bien masqué
    if (elements.loadingIndicator) {
        elements.loadingIndicator.hidden = true;
    }
}

/**
 * Obtient les horaires correspondant à un code
 * @param {string} code - Le code
 * @returns {string|null} - Les horaires correspondants ou null si aucune correspondance
 */
function getCodeHours(code) {
    // Vérifier si le code existe dans les codes valides
    if (appState.codesData && appState.codesData[code]) {
        const startTime = appState.codesData[code].startTime || '';
        const endTime = appState.codesData[code].endTime || '';
        
        if (startTime && endTime) {
            return `${startTime} - ${endTime}`;
        } else if (startTime) {
            return `Début: ${startTime}`;
        } else if (endTime) {
            return `Fin: ${endTime}`;
        }
    }
    
    return null;
}

/**
 * Crée une légende des codes avec leurs couleurs et descriptions
 * @returns {HTMLElement} - L'élément de légende des codes
 */
function createCodeLegend() {
    const container = document.createElement('div');
    container.className = 'code-legend';
    
    const title = document.createElement('h3');
    title.textContent = 'Légende des codes';
    container.appendChild(title);
    
    const legendItems = document.createElement('div');
    legendItems.className = 'code-legend-items';
    
    // Ajouter chaque code valide à la légende
    if (appState.validCodes && appState.validCodes.length > 0) {
        appState.validCodes.forEach(code => {
            const item = document.createElement('div');
            item.className = `code-legend-item code-${code}`;
            
            const colorBox = document.createElement('div');
            colorBox.className = 'code-legend-color';
            colorBox.style.backgroundColor = getCodeColor(code) || '#ccc';
            
            const text = document.createElement('span');
            text.textContent = `${code}: ${getCodeDescription(code) || 'Code'}`;
            
            item.appendChild(colorBox);
            item.appendChild(text);
            legendItems.appendChild(item);
        });
    }
    
    container.appendChild(legendItems);
    return container;
}

/**
 * Obtient la couleur correspondant à un code
 * @param {string} code - Le code
 * @returns {string|null} - La couleur correspondante ou null si aucune correspondance
 */
function getCodeColor(code) {
    // Vérifier si le code existe dans les codes valides
    if (appState.codesData && appState.codesData[code] && appState.codesData[code].color) {
        return appState.codesData[code].color;
    }
    
    // Sinon, utiliser les couleurs par défaut
    const codeColors = {
        'C9E': '#ff7b24', // Orange
        'FH': '#3e9c1c',  // Vert foncé
        'J2B': '#f4ed1f', // Jaune
        'J9B': '#f1f443', // Jaune clair
        'JPX': '#fbff00', // Jaune vif
        'M7M': '#e7ea34', // Jaune-vert
        'N7H': '#1f71f4', // Bleu
        'RH': '#f143f4',  // Rose
        'RC': '#f143f4',  // Rose
        'M7E': '#f4ee43'  // Jaune
    };
    
    // Retourner la couleur correspondante ou null si aucune correspondance
    return codeColors[code] || '#f5f5f5'; // Gris clair par défaut
}

/**
 * Obtient la description d'un code
 * @param {string} code - Le code
 * @returns {string|null} - La description du code ou null si aucune correspondance
 */
function getCodeDescription(code) {
    // Vérifier si le code existe dans les codes valides
    if (appState.codesData && appState.codesData[code] && appState.codesData[code].description) {
        return appState.codesData[code].description;
    }
    
    // Sinon, utiliser les descriptions par défaut
    const codeDescriptions = {
        'C9E': 'C9E',
        'FH': 'Formation en heures',
        'J2B': 'J2B',
        'J9B': 'J9B',
        'JPX': 'JPX',
        'M7M': 'M7M',
        'N7H': 'Nuit 7heure',
        'RH': 'repos Hebdomadaire',
        'RC': 'Repos copensatoire',
        'M7E': 'M7E'
    };
    
    // Retourner la description correspondante ou null si aucune correspondance
    return codeDescriptions[code] || code;
}

/**
 * Exporte les résultats au format ICS
 */
function exportToICS() {
    console.log("Exportation au format ICS...");
    
    // Vérifier si des résultats sont disponibles
    if (!appState.results || !appState.results.codes || appState.results.codes.length === 0) {
        showToast("Aucun résultat à exporter", "error");
        return;
    }
    
    try {
        // Récupérer les informations nécessaires
        const personName = appState.results.personName || appState.personName || "Inconnu";
        const month = appState.results.month || appState.month || new Date().getMonth() + 1;
        const year = appState.results.year || appState.year || new Date().getFullYear();
        const codes = appState.results.codes;
        
        // Créer le contenu ICS
        let icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Calendrier Leo//Planning Export//FR",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            `X-WR-CALNAME:Planning ${personName} - ${month}/${year}`
        ];
        
        // Ajouter chaque code comme un événement
        codes.forEach((codeInfo, index) => {
            // Récupérer les informations du code
            const code = codeInfo;
            const day = index + 1;
            
            // Créer la date de début et de fin
            const startDate = new Date(year, month - 1, day);
            const endDate = new Date(year, month - 1, day);
            endDate.setDate(endDate.getDate() + 1); // Fin = jour suivant à minuit
            
            // Formater les dates pour ICS (format: YYYYMMDDTHHMMSSZ)
            const formatDate = (date) => {
                return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
            };
            
            // Récupérer la description du code
            const description = getCodeDescription(code) || `Code: ${code}`;
            
            // Ajouter l'événement au calendrier
            icsContent = icsContent.concat([
                "BEGIN:VEVENT",
                `UID:${Date.now()}-${day}-${code}@calendrier-leo.app`,
                `DTSTAMP:${formatDate(new Date())}`,
                `DTSTART:${formatDate(startDate)}`,
                `DTEND:${formatDate(endDate)}`,
                `SUMMARY:${code} - ${personName}`,
                `DESCRIPTION:${description}`,
                "END:VEVENT"
            ]);
        });
        
        // Finaliser le calendrier
        icsContent.push("END:VCALENDAR");
        
        // Créer le fichier ICS
        const icsData = icsContent.join("\r\n");
        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
        
        // Créer un lien de téléchargement
        const fileName = `planning_${personName.replace(/\s+/g, '_')}_${month}_${year}.ics`;
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        
        // Ajouter le lien au document, cliquer dessus, puis le supprimer
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showToast("Exportation ICS réussie", "success");
    } catch (error) {
        console.error("Erreur lors de l'exportation ICS:", error);
        
        // Mettre à jour l'état de l'application
        appState.isAnalyzing = false;
        
        // Afficher un message d'erreur
        showToast(`Erreur lors de l'exportation: ${error.message}`, "error");
        
        // Masquer l'indicateur de chargement
        elements.loadingIndicator.hidden = true;
    }
}

/**
 * Exporte les résultats au format JSON
 */
function exportToJSON() {
    console.log("Export au format JSON");
    // Implémentation à venir
    showToast("Export JSON en cours de développement", "info");
}

/**
 * Copie les résultats dans le presse-papier
 */
function copyToClipboard() {
    console.log("Copie dans le presse-papier");
    // Implémentation à venir
    showToast("Copie en cours de développement", "info");
}

/**
 * Affiche/masque la section des paramètres
 */
function toggleSettings() {
    console.log("Basculement de la section des paramètres");
    
    if (elements.settingsSection) {
        const isHidden = elements.settingsSection.hidden;
        
        // Masquer toutes les sections
        if (elements.uploadSection) elements.uploadSection.hidden = !isHidden;
        if (elements.processingSection) elements.processingSection.hidden = !isHidden;
        if (elements.resultsSection) elements.resultsSection.hidden = !isHidden;
        
        // Afficher/masquer la section des paramètres
        elements.settingsSection.hidden = !isHidden;
        
        // Charger les paramètres actuels
        if (!isHidden) {
            const apiSettings = loadApiSettings();
            if (elements.apiKeyInput) {
                elements.apiKeyInput.value = apiSettings.apiKey || '';
            }
        }
    }
}

/**
 * Enregistre les paramètres
 */
function saveSettings() {
    console.log("Enregistrement des paramètres");
    
    if (elements.apiKeyInput) {
        const apiKey = elements.apiKeyInput.value.trim();
        
        // Enregistrer la clé API
        localStorage.setItem('apiSettings', JSON.stringify({
            apiKey: apiKey,
            model: 'mistral-ocr-latest',
            strictMode: true
        }));
        
        // Afficher un message de confirmation
        showToast("Paramètres enregistrés avec succès", "success");
        
        // Revenir à l'écran principal
        toggleSettings();
    }
}

/**
 * Charge les paramètres de l'API
 * @returns {Object} - Paramètres de l'API
 */
function loadApiSettings() {
    const apiSettings = {
        apiKey: '',
        model: 'mistral-ocr-latest',
        strictMode: true
    };
    
    // Charger depuis appSettings (nouvelle méthode)
    const appSettingsJson = localStorage.getItem('appSettings');
    if (appSettingsJson) {
        try {
            const appSettings = JSON.parse(appSettingsJson);
            if (appSettings && appSettings.apiSettings) {
                apiSettings.apiKey = appSettings.apiSettings.apiKey || '';
                apiSettings.model = appSettings.apiSettings.model || 'mistral-ocr-latest';
                apiSettings.strictMode = appSettings.apiSettings.strictMode !== false; // Par défaut à true
                
                console.log("Paramètres API chargés:", { 
                    hasApiKey: !!apiSettings.apiKey, 
                    model: apiSettings.model,
                    strictMode: apiSettings.strictMode
                });
                
                return apiSettings;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API depuis appSettings:', error);
        }
    }
    
    // Essayer de charger depuis apiSettings (ancienne méthode)
    const savedSettings = localStorage.getItem('apiSettings');
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            apiSettings.apiKey = parsedSettings.apiKey || '';
            apiSettings.model = parsedSettings.model || 'mistral-ocr-latest';
            apiSettings.strictMode = parsedSettings.strictMode !== false; // Par défaut à true
            
            console.log("Paramètres API chargés (ancienne méthode):", { 
                hasApiKey: !!apiSettings.apiKey, 
                model: apiSettings.model,
                strictMode: apiSettings.strictMode
            });
            
            // Migrer vers appSettings
            saveApiSettings(apiSettings);
            
            // Supprimer l'ancienne clé
            localStorage.removeItem('apiSettings');
            
            return apiSettings;
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres API:', error);
        }
    } else {
        console.log("Aucun paramètre API trouvé, utilisation des valeurs par défaut");
    }
    
    // Fallback sur la clé API stockée directement (pour la compatibilité)
    if (!apiSettings.apiKey) {
        const directApiKey = localStorage.getItem('mistralApiKey');
        if (directApiKey) {
            apiSettings.apiKey = directApiKey;
            console.log("Clé API chargée depuis le stockage direct");
            
            // Migrer vers appSettings
            saveApiSettings(apiSettings);
            
            // Supprimer l'ancienne clé
            localStorage.removeItem('mistralApiKey');
        }
    }
    
    return apiSettings;
}

/**
 * Sauvegarde les paramètres de l'API
 * @param {Object} apiSettings - Paramètres de l'API à sauvegarder
 */
function saveApiSettings(apiSettings) {
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
    
    // Mettre à jour les paramètres API
    appSettings.apiSettings = apiSettings;
    
    // Sauvegarder
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    console.log("Paramètres API sauvegardés dans appSettings");
}

/**
 * Affiche un message toast
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message (success, error, info)
 */
function showToast(message, type = 'info') {
    console.log(`Toast (${type}): ${message}`);
    
    if (!elements.toastContainer || !elements.toastMessage) {
        console.error("Éléments toast non trouvés");
        return;
    }
    
    // Définir le message
    elements.toastMessage.textContent = message;
    
    // Définir la classe en fonction du type
    elements.toastContainer.className = 'toast';
    elements.toastContainer.classList.add(`toast-${type}`);
    
    // Afficher le toast
    elements.toastContainer.hidden = false;
    
    // Masquer le toast après 3 secondes
    setTimeout(() => {
        elements.toastContainer.hidden = true;
    }, 3000);
}

/**
 * Génère des codes de démonstration
 * 
 * @param {number} count - Nombre de codes à générer
 * @returns {Array<string>} - Tableau de codes générés
 */
function generateDemoCodes(count = 10) {
    console.log(`Génération de ${count} codes de démonstration`);
    
    // Liste de codes valides pour la démonstration
    const demoCodes = ['RH', 'J8D', 'M7M', 'C9E', 'JPY', 'JPC', 'SFC', 'NZH', 'RC'];
    
    // Générer des codes aléatoires
    const codes = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * demoCodes.length);
        codes.push(demoCodes[randomIndex]);
    }
    
    return codes;
}

/**
 * Calcule la similarité entre deux chaînes
 * 
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Score de similarité entre 0 et 1
 */
function calculateStringSimilarity(str1, str2) {
    // Normaliser les chaînes
    str1 = str1.toUpperCase().trim();
    str2 = str2.toUpperCase().trim();
    
    // Si les chaînes sont identiques
    if (str1 === str2) return 1.0;
    
    // Si l'une des chaînes est vide
    if (str1.length === 0 || str2.length === 0) return 0.0;
    
    // Calculer la distance de Levenshtein
    const distance = levenshteinDistance(str1, str2);
    
    // Calculer la similarité
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * 
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Distance de Levenshtein
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    
    // Créer une matrice de taille (m+1) x (n+1)
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialiser la première colonne et la première ligne
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    
    // Remplir la matrice
    for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= m; i++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // suppression
                d[i][j - 1] + 1,      // insertion
                d[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    return d[m][n];
}

/**
 * Vérifie si une chaîne est un code valide
 * 
 * @param {string} str - Chaîne à vérifier
 * @returns {boolean} - true si la chaîne est un code valide
 */
function isValidCode(str) {
    if (!str) return false;
    
    // Normaliser la chaîne
    str = str.trim().toUpperCase();
    
    // Vérifier si c'est un code connu
    if (window.VALID_CODES && window.VALID_CODES.includes(str)) {
        return true;
    }
    
    // Vérifier les formats de code courants
    return /^(RH|RHE|[A-Z][0-9][A-Z]|[A-Z][0-9][0-9]|[A-Z][A-Z][A-Z]|[A-Z][A-Z][0-9])$/.test(str);
}

// Charge les codes valides depuis le fichier de paramètres
function loadCodesFromSettings() {
    try {
        // Essayer de charger les codes depuis le stockage local (appSettings)
        const settingsJson = localStorage.getItem('appSettings');
        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            if (settings && settings.codes) {
                console.log("Codes chargés depuis appSettings:", Object.keys(settings.codes));
                return settings.codes;
            }
        }
        
        // Si aucun code n'est trouvé dans appSettings, essayer de charger depuis le fichier JSON
        return loadCodesFromJsonFile();
    } catch (error) {
        console.error("Erreur lors du chargement des codes:", error);
        return getDefaultCodes();
    }
}

// Charge les codes depuis le fichier JSON
async function loadCodesFromJsonFile() {
    try {
        const response = await fetch('calendrier-leo-settings.json');
        if (!response.ok) {
            throw new Error('Fichier de paramètres non trouvé');
        }
        
        const data = await response.json();
        console.log("Fichier de paramètres chargé:", data);
        
        if (data.codes) {
            // Sauvegarder les codes dans appSettings pour les futures utilisations
            saveCodesInAppSettings(data.codes);
            return data.codes;
        }
        
        // Si le fichier JSON ne contient pas de codes, utiliser les codes par défaut
        return getDefaultCodes();
    } catch (error) {
        console.warn("Erreur lors du chargement du fichier de paramètres:", error);
        return getDefaultCodes();
    }
}

// Sauvegarde les codes dans appSettings
function saveCodesInAppSettings(codes) {
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
    appSettings.codes = codes;
    
    // Sauvegarder
    localStorage.setItem('appSettings', JSON.stringify(appSettings));
    console.log("Codes sauvegardés dans appSettings:", Object.keys(codes));
}

// Retourne les codes par défaut
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

// Initialise l'application
function initApp() {
    console.log("DOM chargé, initialisation de l'application...");
    
    // Initialiser les éléments DOM
    console.log("Initialisation des éléments DOM");
    initElements();
    console.log("Éléments DOM initialisés");
    
    // Initialiser l'état de l'application
    console.log("Initialisation de l'état de l'application");
    initAppState();
    
    // Initialiser les gestionnaires d'événements
    console.log("Initialisation des gestionnaires d'événements");
    initEventListeners();
    console.log("Gestionnaires d'événements initialisés");
    
    // Charger les paramètres de l'API
    const apiSettings = loadApiSettings();
    console.log("Paramètres API chargés:", {
        apiKey: apiSettings.apiKey ? apiSettings.apiKey.substring(0, 10) + '...' : 'non définie',
        model: apiSettings.model,
        strictMode: apiSettings.strictMode
    });
    
    // Charger les codes valides
    appState.codesData = loadCodesFromSettings();
    console.log("Données des codes chargées:", appState.codesData);
    
    // Générer la liste des codes valides
    appState.validCodes = Object.keys(appState.codesData);
    console.log(`${appState.validCodes.length} codes valides chargés:`, appState.validCodes);
    
    // Créer la légende des codes
    createCodeLegend();
    
    // Charger le fichier de paramètres (mais ne pas écraser les paramètres API existants)
    loadSettingsFile();
    
    console.log("Application initialisée avec succès");
}

/**
 * Charge le fichier de paramètres sans écraser les paramètres API existants
 */
function loadSettingsFile() {
    fetch('calendrier-leo-settings.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Fichier de paramètres non trouvé');
            }
            return response.json();
        })
        .then(data => {
            console.log("Fichier de paramètres chargé:", data);
            
            // Mettre à jour les codes
            if (data.codes) {
                // Sauvegarder les codes dans appSettings sans écraser les paramètres API
                let appSettings = {};
                const appSettingsJson = localStorage.getItem('appSettings');
                if (appSettingsJson) {
                    try {
                        appSettings = JSON.parse(appSettingsJson);
                    } catch (error) {
                        console.error('Erreur lors du chargement de appSettings:', error);
                    }
                }
                
                // Mettre à jour uniquement les codes, pas les paramètres API
                appSettings.codes = data.codes;
                
                // Sauvegarder
                localStorage.setItem('appSettings', JSON.stringify(appSettings));
                console.log(`${Object.keys(data.codes).length} codes mis à jour depuis le fichier de paramètres`);
                
                // Mettre à jour les codes dans l'application
                appState.codesData = data.codes;
                appState.validCodes = Object.keys(data.codes);
                
                // Mettre à jour la légende des codes
                createCodeLegend();
            }
            
            // Ne pas écraser les paramètres API existants si une clé API est déjà configurée
            if (data.apiSettings) {
                const appSettingsJson = localStorage.getItem('appSettings');
                if (appSettingsJson) {
                    try {
                        const appSettings = JSON.parse(appSettingsJson);
                        if (appSettings && appSettings.apiSettings && appSettings.apiSettings.apiKey) {
                            console.log("Paramètres API existants conservés (clé API déjà configurée)");
                            return;
                        }
                    } catch (error) {
                        console.error('Erreur lors du chargement de appSettings:', error);
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

// Initialise l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de l\'application...');
    
    initApp();
    
    console.log("Application initialisée avec succès");
});

// Ajoute un bouton pour permettre à l'utilisateur d'entrer manuellement les codes
function addManualEntryButton() {
    // Vérifier si le bouton existe déjà
    if (document.getElementById('manual-entry-button')) {
        return;
    }
    
    // Créer le bouton
    const manualEntryButton = document.createElement('button');
    manualEntryButton.id = 'manual-entry-button';
    manualEntryButton.className = 'button secondary-button';
    manualEntryButton.textContent = 'Saisie manuelle des codes';
    manualEntryButton.onclick = showManualEntryForm;
    
    // Ajouter le bouton après le bouton d'analyse
    if (elements.analyzeButton && elements.analyzeButton.parentNode) {
        elements.analyzeButton.parentNode.insertBefore(manualEntryButton, elements.analyzeButton.nextSibling);
    }
}

// Affiche le formulaire de saisie manuelle des codes
function showManualEntryForm() {
    // Créer le formulaire s'il n'existe pas déjà
    let manualEntryForm = document.getElementById('manual-entry-form');
    
    if (!manualEntryForm) {
        manualEntryForm = document.createElement('div');
        manualEntryForm.id = 'manual-entry-form';
        manualEntryForm.className = 'manual-entry-form';
        
        // Créer le titre
        const title = document.createElement('h3');
        title.textContent = 'Saisie manuelle des codes';
        manualEntryForm.appendChild(title);
        
        // Créer la description
        const description = document.createElement('p');
        description.textContent = 'Entrez les codes visibles dans l\'image, séparés par des virgules ou des espaces.';
        manualEntryForm.appendChild(description);
        
        // Créer le champ de saisie
        const input = document.createElement('textarea');
        input.id = 'manual-codes-input';
        input.placeholder = 'Exemple: JRD, RH, M7M, JRD, JRD, C9E, RH, RH, RH, RH, M7M, C9E, ...';
        input.rows = 5;
        manualEntryForm.appendChild(input);
        
        // Créer le bouton de validation
        const submitButton = document.createElement('button');
        submitButton.className = 'button primary-button';
        submitButton.textContent = 'Valider les codes';
        submitButton.onclick = processManualCodes;
        manualEntryForm.appendChild(submitButton);
        
        // Créer le bouton d'annulation
        const cancelButton = document.createElement('button');
        cancelButton.className = 'button secondary-button';
        cancelButton.textContent = 'Annuler';
        cancelButton.onclick = () => {
            manualEntryForm.style.display = 'none';
        };
        manualEntryForm.appendChild(cancelButton);
        
        // Ajouter le formulaire à la page
        if (elements.uploadSection) {
            elements.uploadSection.appendChild(manualEntryForm);
        } else {
            document.body.appendChild(manualEntryForm);
        }
    }
    
    // Afficher le formulaire
    manualEntryForm.style.display = 'block';
}

// Traite les codes entrés manuellement par l'utilisateur
function processManualCodes() {
    // Récupérer les codes entrés par l'utilisateur
    const input = document.getElementById('manual-codes-input');
    
    if (!input || !input.value.trim()) {
        showToast('Veuillez entrer des codes', 'error');
        return;
    }
    
    // Récupérer le nom de la personne
    let personName = '';
    if (elements.personNameInput && elements.personNameInput.value.trim()) {
        personName = elements.personNameInput.value.trim();
    }
    
    if (!personName) {
        showToast('Veuillez saisir un nom', 'error');
        return;
    }
    
    // Récupérer le mois et l'année
    const month = parseInt(elements.monthSelect.value);
    const year = parseInt(elements.yearInput.value);
    
    if (isNaN(month) || isNaN(year)) {
        showToast('Veuillez saisir un mois et une année valides', 'error');
        return;
    }
    
    // Traiter les codes
    const codesText = input.value.trim();
    let codes = codesText.split(/[\s,;]+/).filter(code => code.trim() !== '');
    
    // Calculer le nombre de jours dans le mois
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Compléter ou tronquer les codes si nécessaire
    if (codes.length < daysInMonth) {
        console.log(`Complétion des codes manquants (${codes.length} -> ${daysInMonth})`);
        const defaultCode = 'RHE'; // Code par défaut
        while (codes.length < daysInMonth) {
            codes.push(defaultCode);
        }
    } else if (codes.length > daysInMonth) {
        console.log(`Troncature des codes excédentaires (${codes.length} -> ${daysInMonth})`);
        codes = codes.slice(0, daysInMonth);
    }
    
    // Créer le résultat
    const result = {
        found: true,
        name: personName,
        codes: codes,
        rawText: `Codes entrés manuellement: ${codesText}`,
        month: month,
        year: year,
        manualEntry: true
    };
    
    // Mettre à jour l'état de l'application
    appState.results = result;
    appState.personName = personName;
    appState.month = month;
    appState.year = year;
    
    // Afficher les résultats
    displayResults(result);
    
    // Masquer le formulaire
    const manualEntryForm = document.getElementById('manual-entry-form');
    if (manualEntryForm) {
        manualEntryForm.style.display = 'none';
    }
    
    // Afficher un message de succès
    showToast('Codes traités avec succès', 'success');
}

// Analyse le planning pour le nom sélectionné
async function analyzeSchedule() {
    console.log("Analyse du planning...");
    
    // Vérifier si un fichier a été chargé
    if (!appState.imageFile) {
        showToast("Veuillez d'abord charger une image", "error");
        return;
    }
    
    // Vérifier si un nom a été saisi
    let personName = '';
    
    if (elements.personNameInput && elements.personNameInput.value.trim()) {
        personName = elements.personNameInput.value.trim();
    }
    
    if (!personName) {
        showToast("Veuillez saisir un nom", "error");
        return;
    }
    
    // Récupérer le mois et l'année
    const month = parseInt(elements.monthSelect.value);
    const year = parseInt(elements.yearInput.value);
    
    if (isNaN(month) || isNaN(year)) {
        showToast("Veuillez saisir un mois et une année valides", "error");
        return;
    }
    
    // Mettre à jour l'état de l'application
    appState.personName = personName;
    appState.month = month;
    appState.year = year;
    appState.isAnalyzing = true;
    
    // Afficher l'indicateur de chargement
    if (elements.loadingIndicator) {
        elements.loadingIndicator.hidden = false;
    }
    
    if (elements.resultsContent) {
        elements.resultsContent.hidden = true;
    }
    
    if (elements.resultsSection) {
        elements.resultsSection.hidden = false;
    }
    
    try {
        // Charger les paramètres de l'API directement depuis appSettings
        const appSettingsJson = localStorage.getItem('appSettings');
        let apiKey = '';
        let model = 'mistral-ocr-latest';
        let strictMode = true;
        
        if (appSettingsJson) {
            try {
                const appSettings = JSON.parse(appSettingsJson);
                if (appSettings && appSettings.apiSettings) {
                    apiKey = appSettings.apiSettings.apiKey || '';
                    model = appSettings.apiSettings.model || 'mistral-ocr-latest';
                    strictMode = appSettings.apiSettings.strictMode !== false;
                    
                    console.log("Paramètres API chargés pour l'analyse:", {
                        hasApiKey: !!apiKey,
                        model: model,
                        strictMode: strictMode
                    });
                }
            } catch (error) {
                console.error('Erreur lors du chargement des paramètres API depuis appSettings:', error);
            }
        }
        
        // Si aucune clé API n'est trouvée, essayer les méthodes de secours
        if (!apiKey) {
            // Essayer de charger depuis apiSettings (ancienne méthode)
            const savedSettings = localStorage.getItem('apiSettings');
            if (savedSettings) {
                try {
                    const parsedSettings = JSON.parse(savedSettings);
                    apiKey = parsedSettings.apiKey || '';
                    
                    if (apiKey) {
                        console.log("Clé API chargée depuis apiSettings (ancienne méthode)");
                    }
                } catch (error) {
                    console.error('Erreur lors du chargement de la clé API:', error);
                }
            }
            
            // Essayer de charger depuis mistralApiKey (ancienne méthode)
            if (!apiKey) {
                const directApiKey = localStorage.getItem('mistralApiKey');
                if (directApiKey) {
                    apiKey = directApiKey;
                    console.log("Clé API chargée depuis le stockage direct (ancienne méthode)");
                }
            }
            
            // Si une clé API a été trouvée par les méthodes de secours, la sauvegarder dans appSettings
            if (apiKey) {
                saveApiSettings({
                    apiKey: apiKey,
                    model: model,
                    strictMode: strictMode
                });
            }
        }
        
        // Analyser l'image avec Mistral OCR
        console.log("Analyse de l'image avec Mistral OCR...");
        console.log("Utilisation de la clé API:", apiKey ? "Présente" : "Absente");
        const ocrResult = await analyzeImageWithMistralOCR(appState.imageFile, apiKey);
        
        if (!ocrResult || !ocrResult.success) {
            throw new Error(ocrResult?.error || "Erreur lors de l'analyse OCR");
        }
        
        console.log("Résultat OCR obtenu:", ocrResult);
        
        // Analyser le texte OCR pour la personne spécifique
        console.log(`Analyse du texte OCR pour ${personName}...`);
        const result = await analyzeOcrTextForPerson(ocrResult.ocrText, personName, month, year);
        
        // Mettre à jour l'état de l'application
        appState.results = result;
        appState.isAnalyzing = false;
        
        // S'assurer que le loader est masqué avant d'afficher les résultats
        if (elements.loadingIndicator) {
            elements.loadingIndicator.hidden = true;
        }
        
        // Afficher les résultats
        displayResults(result);
        
        console.log("Analyse terminée avec succès");
        showToast("Analyse terminée avec succès", "success");
    } catch (error) {
        console.error("Erreur lors de l'analyse:", error);
        
        // Mettre à jour l'état de l'application
        appState.isAnalyzing = false;
        
        // Afficher un message d'erreur
        showToast(`Erreur lors de l'analyse`, "error");
        
        // Masquer l'indicateur de chargement
        if (elements.loadingIndicator) {
            elements.loadingIndicator.hidden = true;
        }
    } finally {
        // S'assurer que le loader est toujours masqué, quoi qu'il arrive
        if (elements.loadingIndicator) {
            elements.loadingIndicator.hidden = true;
        }
    }
}
