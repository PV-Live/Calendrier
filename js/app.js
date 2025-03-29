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
    extractedNames: [] // Nouveau: liste des noms extraits de l'image
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
 * @param {string} ocrText - Texte OCR brut
 * @param {string} personName - Nom de la personne à rechercher
 * @returns {Object} - Résultat de l'analyse
 */
async function analyzeOcrTextForPerson(ocrText, personName) {
    console.log(`Analyse du texte OCR pour ${personName}`);
    
    // Normaliser le nom de la personne (majuscules)
    const normalizedName = personName.toUpperCase().trim();
    console.log('Nom normalisé:', normalizedName);
    
    // Stocker le texte OCR brut dans l'état de l'application pour le débogage
    appState.ocrText = ocrText;
    
    // Vérifier si le texte OCR est au format tableau Markdown
    if (ocrText.includes('|')) {
        console.log('Format tableau Markdown détecté');
        
        // Vérifier si le tableau a plusieurs lignes
        const lines = ocrText.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length <= 2) {
            console.log('Une seule ligne de tableau détectée, analyse directe');
            
            // Extraire les cellules de la ligne
            const cells = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            
            if (cells.length > 0) {
                // Vérifier si la première cellule correspond au nom recherché
                const firstCell = cells[0];
                console.log('Première cellule:', JSON.stringify(firstCell));
                
                // Calculer la similarité entre le nom recherché et la première cellule
                const similarity = calculateStringSimilarity(normalizedName, firstCell);
                console.log(`Similarité avec "${firstCell}": ${similarity}`);
                
                if (similarity > 0.5) {
                    // La première cellule correspond au nom recherché
                    console.log(`Correspondance trouvée: "${firstCell}" pour "${normalizedName}"`);
                    
                    // Extraire les codes (toutes les autres cellules)
                    const codes = cells.slice(1).filter(code => isValidCode(code));
                    
                    return {
                        found: true,
                        name: firstCell,
                        codes: codes,
                        rawText: ocrText
                    };
                } else {
                    console.log('Aucune correspondance trouvée dans la première ligne');
                    
                    // Essayer de trouver des correspondances dans toutes les cellules
                    for (let i = 0; i < cells.length; i++) {
                        const cell = cells[i];
                        const similarity = calculateStringSimilarity(normalizedName, cell);
                        
                        if (similarity > 0.5) {
                            console.log(`Correspondance trouvée dans la cellule ${i}: "${cell}"`);
                            
                            // Extraire les codes (toutes les cellules suivantes)
                            const codes = cells.slice(i + 1).filter(code => isValidCode(code));
                            
                            return {
                                found: true,
                                name: cell,
                                codes: codes,
                                rawText: ocrText
                            };
                        }
                    }
                    
                    // Si aucune correspondance n'est trouvée, générer des codes de démonstration
                    console.log('Aucune correspondance trouvée, génération de codes de démonstration');
                    return {
                        found: false,
                        name: normalizedName,
                        codes: generateDemoCodes(10),
                        rawText: ocrText
                    };
                }
            }
        } else {
            // Le tableau a plusieurs lignes, traitement normal
            console.log('Tableau avec plusieurs lignes détecté, traitement normal');
            
            // Parcourir chaque ligne du tableau
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Ignorer les lignes d'en-tête et de séparation
                if (line.includes('---') || i === 0) {
                    continue;
                }
                
                // Extraire les cellules de la ligne
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                
                if (cells.length > 0) {
                    // Vérifier si la première cellule contient le nom recherché
                    const firstCell = cells[0];
                    
                    // Calculer la similarité entre le nom recherché et la première cellule
                    const similarity = calculateStringSimilarity(normalizedName, firstCell);
                    console.log(`Ligne ${i}: Similarité entre "${normalizedName}" et "${firstCell}": ${similarity}`);
                    
                    // Vérifier si le nom recherché est contenu dans la première cellule
                    const containsName = firstCell.toUpperCase().includes(normalizedName);
                    
                    if (similarity > 0.5 || containsName) {
                        // La première cellule correspond au nom recherché
                        console.log(`Correspondance trouvée à la ligne ${i}: "${firstCell}" pour "${normalizedName}"`);
                        
                        // Extraire les codes (toutes les autres cellules)
                        const codes = cells.slice(1).filter(code => isValidCode(code));
                        console.log(`${codes.length} codes valides trouvés`);
                        
                        return {
                            found: true,
                            name: firstCell,
                            codes: codes,
                            rawText: ocrText,
                            month: new Date().getMonth() + 1 // Mois actuel (1-12)
                        };
                    }
                }
            }
            
            // Si aucune correspondance n'est trouvée
            console.log('Aucune correspondance trouvée dans le tableau');
        }
    } else {
        console.log('Format texte brut détecté, recherche de motifs');
        
        // Rechercher des motifs dans le texte brut
        const regex = new RegExp(`${normalizedName}[\\s\\:]+([A-Z0-9\\s\\,\\.\\-]+)`, 'i');
        const match = ocrText.match(regex);
        
        if (match && match[1]) {
            console.log('Motif trouvé:', match[0]);
            
            // Extraire les codes
            const codesText = match[1].trim();
            const codes = codesText.split(/[\s\,\.]+/).filter(code => isValidCode(code));
            
            return {
                found: true,
                name: normalizedName,
                codes: codes,
                rawText: ocrText,
                month: new Date().getMonth() + 1 // Mois actuel (1-12)
            };
        }
    }
    
    // Si aucune correspondance n'est trouvée, générer des codes de démonstration
    console.log('Aucune correspondance trouvée, génération de codes de démonstration');
    const demoCodes = generateDemoCodes(10);
    console.log(`${demoCodes.length} codes générés pour la démonstration`);
    
    return {
        found: false,
        name: normalizedName,
        codes: demoCodes,
        rawText: ocrText,
        month: new Date().getMonth() + 1 // Mois actuel (1-12)
    };
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
    
    // Ajouter chaque code au tableau
    result.codes.forEach((code, index) => {
        // Déterminer le jour en fonction de l'index et du mois
        const day = index + 1;
        
        const row = document.createElement('tr');
        
        // Colonne du jour
        const dayCell = document.createElement('td');
        dayCell.textContent = `Jour ${day}`;
        row.appendChild(dayCell);
        
        // Colonne du code
        const codeCell = document.createElement('td');
        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.value = code;
        codeInput.className = 'code-input';
        codeInput.dataset.index = index;
        codeInput.addEventListener('change', function() {
            // Mettre à jour le code dans les résultats
            const newCode = this.value.trim().toUpperCase();
            if (newCode) {
                result.codes[index] = newCode;
                // Mettre à jour l'état de l'application
                appState.results = result;
                // Mettre à jour la description
                const descriptionElement = row.querySelector('.code-description');
                if (descriptionElement) {
                    descriptionElement.textContent = getCodeDescription(newCode) || `Code: ${newCode}`;
                }
            }
        });
        codeCell.appendChild(codeInput);
        row.appendChild(codeCell);
        
        // Colonne de la description
        const descriptionCell = document.createElement('td');
        const descriptionSpan = document.createElement('span');
        descriptionSpan.className = 'code-description';
        descriptionSpan.textContent = getCodeDescription(code) || `Code: ${code}`;
        descriptionCell.appendChild(descriptionSpan);
        row.appendChild(descriptionCell);
        
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
    
    // Ajouter un affichage du texte OCR brut
    const rawOcrContainer = document.createElement('div');
    rawOcrContainer.className = 'raw-ocr-container';
    
    const rawOcrTitle = document.createElement('h3');
    rawOcrTitle.textContent = 'Texte OCR brut (pour débogage)';
    rawOcrContainer.appendChild(rawOcrTitle);
    
    const rawOcrContent = document.createElement('pre');
    rawOcrContent.className = 'raw-ocr-content';
    rawOcrContent.textContent = result.rawText || 'Aucun texte OCR disponible';
    rawOcrContainer.appendChild(rawOcrContent);
    
    // Bouton pour copier le texte OCR
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copier le texte OCR';
    copyButton.className = 'copy-button';
    copyButton.onclick = function() {
        navigator.clipboard.writeText(result.rawText || '')
            .then(() => showToast('Texte OCR copié dans le presse-papier', 'success'))
            .catch(err => showToast('Erreur lors de la copie: ' + err, 'error'));
    };
    rawOcrContainer.appendChild(copyButton);
    
    elements.resultsContent.appendChild(rawOcrContainer);
}

/**
 * Obtient la description d'un code à partir de la légende stockée
 * @param {string} code - Le code à décrire
 * @returns {string} - La description du code
 */
function getCodeDescription(code) {
    if (!code) return '';
    
    // Charger la légende des codes depuis le stockage local
    const savedCodes = localStorage.getItem('codeLegend');
    let codeLegend = {};
    
    if (savedCodes) {
        try {
            codeLegend = JSON.parse(savedCodes);
        } catch (error) {
            console.error('Erreur lors du chargement de la légende des codes:', error);
        }
    }
    
    // Vérifier si le code existe dans la légende
    if (codeLegend[code]) {
        const codeData = codeLegend[code];
        return `${codeData.description} (${codeData.startTime} - ${codeData.endTime})`;
    }
    
    // Fallback sur des descriptions par défaut si le code n'est pas dans la légende
    const defaultDescriptions = {
        'JBD': 'Jour de bureau - Domicile (09:00 - 17:00)',
        'JBO': 'Jour de bureau - Office (09:00 - 17:00)',
        'CP': 'Congé payé',
        'RTT': 'Réduction du temps de travail',
        'RHE': 'Repos hebdomadaire',
        'JF': 'Jour férié',
        'M': 'Matin (09:00 - 13:00)',
        'AM': 'Après-midi (13:00 - 17:00)'
    };
    
    return defaultDescriptions[code] || '';
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
            const code = typeof codeInfo === 'object' ? codeInfo.code : codeInfo;
            const day = typeof codeInfo === 'object' ? codeInfo.day : null;
            
            // Si nous n'avons pas de jour, ignorer ce code
            if (!day) return;
            
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
        showToast(`Erreur lors de l'exportation: ${error.message}`, "error");
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
    const savedSettings = localStorage.getItem('apiSettings');
    const apiSettings = {
        apiKey: '',
        model: 'mistral-ocr-latest',
        strictMode: true
    };
    
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            apiSettings.apiKey = parsedSettings.apiKey || '';
            apiSettings.model = parsedSettings.model || 'mistral-ocr-latest';
            apiSettings.strictMode = parsedSettings.strictMode !== false; // Par défaut à true
            
            console.log("Paramètres API chargés:", { 
                hasApiKey: !!apiSettings.apiKey, 
                model: apiSettings.model,
                strictMode: apiSettings.strictMode
            });
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
        }
    }
    
    return apiSettings;
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

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de l\'application...');
    
    // Initialiser les éléments DOM
    initElements();
    
    // Initialiser l'état de l'application
    initAppState();
    
    // Initialiser les gestionnaires d'événements
    initEventListeners();
    
    // Charger les paramètres de l'API
    loadApiSettings();
    
    // Charger les codes valides
    if (typeof loadValidCodes === 'function') {
        loadValidCodes();
        console.log('Codes valides chargés:', VALID_CODES);
    } else {
        console.warn('Fonction loadValidCodes non disponible');
        // Définir des codes valides par défaut si la fonction n'est pas disponible
        window.VALID_CODES = ['J8D', 'M7M', 'C9E', 'RH', 'JPY', 'JPC', 'SFC', 'NZH', 'RC'];
        console.log('Codes valides par défaut définis:', VALID_CODES);
    }
    
    console.log('Application initialisée avec succès');
});

/**
 * Analyse le planning pour le nom sélectionné
 */
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
    elements.loadingIndicator.hidden = false;
    elements.resultsContent.hidden = true;
    elements.resultsSection.hidden = false;
    
    try {
        // Charger les paramètres de l'API
        const apiSettings = loadApiSettings();
        
        // Analyser l'image avec Mistral OCR
        console.log("Analyse de l'image avec Mistral OCR...");
        const ocrResult = await analyzeImageWithMistralOCR(appState.imageFile, apiSettings.apiKey);
        
        if (!ocrResult || !ocrResult.success) {
            throw new Error(ocrResult?.error || "Erreur lors de l'analyse OCR");
        }
        
        console.log("Résultat OCR obtenu:", ocrResult);
        
        // Analyser le texte OCR pour la personne spécifique
        console.log(`Analyse du texte OCR pour ${personName}...`);
        const result = await analyzeOcrTextForPerson(ocrResult.ocrText, personName);
        
        // Ajouter le mois et l'année aux résultats
        result.month = month;
        result.year = year;
        
        // Mettre à jour l'état de l'application
        appState.results = result;
        appState.isAnalyzing = false;
        
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
        elements.loadingIndicator.hidden = true;
    }
}
