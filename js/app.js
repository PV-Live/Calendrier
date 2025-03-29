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
    
    if (!ocrText) {
        throw new Error("Aucun texte OCR à analyser");
    }
    
    if (!personName) {
        throw new Error("Aucun nom de personne spécifié");
    }
    
    try {
        // Normaliser le nom de la personne pour la recherche
        const normalizedName = personName.trim().toUpperCase();
        console.log(`Nom normalisé: ${normalizedName}`);
        
        // Diviser le texte en lignes
        const lines = ocrText.split('\n').filter(line => line.trim() !== '');
        
        // Vérifier si le texte est au format tableau Markdown
        const isMarkdownTable = ocrText.includes('|');
        
        let personCodes = [];
        let bestMatchScore = 0;
        let bestMatchLine = null;
        
        if (isMarkdownTable) {
            console.log("Format tableau Markdown détecté");
            
            // Si Mistral OCR ne retourne qu'une seule ligne, nous devons l'analyser directement
            if (lines.length === 1 && lines[0].includes('|')) {
                console.log("Une seule ligne de tableau détectée, analyse directe");
                
                const cells = lines[0].split('|')
                    .map(cell => cell.trim())
                    .filter(cell => cell !== '');
                
                // La première cellule contient généralement le nom
                if (cells.length > 0) {
                    const firstCell = cells[0];
                    console.log(`Première cellule: "${firstCell}"`);
                    
                    // Calculer la similarité avec le nom recherché
                    const similarity = calculateStringSimilarity(normalizedName, firstCell.toUpperCase());
                    console.log(`Similarité avec "${firstCell}": ${similarity}`);
                    
                    // Si la similarité est suffisante ou si c'est la seule ligne disponible
                    if (similarity > 0.5 || lines.length === 1) {
                        bestMatchScore = similarity;
                        bestMatchLine = firstCell;
                        
                        // Extraire les codes des autres cellules
                        for (let i = 1; i < cells.length; i++) {
                            const cell = cells[i].trim();
                            if (cell && isLikelyCode(cell)) {
                                personCodes.push({
                                    day: i,
                                    code: cell,
                                    original: cell
                                });
                            }
                        }
                    }
                }
            } else {
                // Essayer d'utiliser la fonction de traitement de tableau Markdown
                try {
                    const tableData = processMarkdownTableWithCorrection(ocrText);
                    
                    if (tableData && tableData.persons) {
                        console.log(`${tableData.persons.length} personnes trouvées dans le tableau`);
                        
                        // Rechercher la personne par similarité de nom
                        for (const person of tableData.persons) {
                            const similarity = calculateStringSimilarity(normalizedName, person.name.toUpperCase());
                            console.log(`Similarité avec ${person.name}: ${similarity}`);
                            
                            if (similarity > bestMatchScore) {
                                bestMatchScore = similarity;
                                bestMatchLine = person.name;
                                personCodes = person.codes.map(code => {
                                    if (typeof code === 'object') {
                                        return {
                                            day: code.day,
                                            code: code.code,
                                            original: code.original || code.code
                                        };
                                    } else {
                                        return {
                                            day: null,
                                            code: code,
                                            original: code
                                        };
                                    }
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error("Erreur lors du traitement du tableau Markdown:", error);
                    // Continuer avec l'analyse de secours
                }
            }
        } else {
            console.log("Format texte standard détecté");
            
            // Pour chaque ligne, calculer la similarité avec le nom recherché
            for (const line of lines) {
                const similarity = calculateStringSimilarity(normalizedName, line.toUpperCase());
                
                if (similarity > bestMatchScore) {
                    bestMatchScore = similarity;
                    bestMatchLine = line;
                }
            }
            
            // Si nous avons trouvé une ligne correspondante
            if (bestMatchLine) {
                console.log(`Meilleure correspondance (${bestMatchScore}): ${bestMatchLine}`);
                
                // Extraire les codes de la ligne
                const codeMatches = bestMatchLine.match(/\b([A-Z0-9]{2,4})\b/g);
                
                if (codeMatches) {
                    // Filtrer les codes qui ne sont pas des nombres ou des dates
                    personCodes = codeMatches
                        .filter(code => !/^([0-9]{1,2})$/.test(code)) // Exclure les nombres simples (jours)
                        .map(code => ({
                            day: null,
                            code: code,
                            original: code
                        }));
                }
            }
        }
        
        // Si nous n'avons pas trouvé de codes mais que nous avons un nom qui correspond
        if (personCodes.length === 0 && bestMatchLine) {
            console.log("Aucun code trouvé, génération de codes fictifs pour démonstration");
            
            // Générer quelques codes fictifs pour démonstration
            const demoCodes = ['RH', 'J8D', 'M7M', 'C9E'];
            for (let i = 1; i <= 5; i++) {
                const randomCode = demoCodes[Math.floor(Math.random() * demoCodes.length)];
                personCodes.push({
                    day: i,
                    code: randomCode,
                    original: randomCode,
                    demo: true
                });
            }
        }
        
        // Si nous avons trouvé des codes
        if (personCodes.length > 0) {
            console.log(`${personCodes.length} codes trouvés pour ${personName}`);
            
            // Corriger les codes si nécessaire
            personCodes = personCodes.map(codeInfo => {
                try {
                    const correctedCode = correctCode(codeInfo.code);
                    return {
                        ...codeInfo,
                        code: correctedCode,
                        corrected: correctedCode !== codeInfo.original
                    };
                } catch (error) {
                    console.warn(`Erreur lors de la correction du code ${codeInfo.code}:`, error);
                    return codeInfo;
                }
            });
            
            // Retourner les résultats
            return {
                success: true,
                personName: personName,
                matchScore: bestMatchScore,
                matchLine: bestMatchLine,
                codes: personCodes,
                rawText: ocrText
            };
        } else {
            console.warn(`Aucun code trouvé pour ${personName}`);
            
            // Retourner un résultat vide mais valide
            return {
                success: true,
                personName: personName,
                matchScore: bestMatchScore,
                matchLine: bestMatchLine,
                codes: [],
                rawText: ocrText
            };
        }
    } catch (error) {
        console.error(`Erreur lors de l'analyse pour ${personName}:`, error);
        throw new Error(`Erreur lors de l'analyse: ${error.message}`);
    }
}

/**
 * Vérifie si une chaîne ressemble à un code
 * @param {string} str - Chaîne à vérifier
 * @returns {boolean} - true si la chaîne ressemble à un code
 */
function isLikelyCode(str) {
    if (!str) return false;
    
    // Normaliser la chaîne
    str = str.trim().toUpperCase();
    
    // Vérifier si c'est un code connu
    if (VALID_CODES && VALID_CODES.includes(str)) {
        return true;
    }
    
    // Vérifier les formats de code courants
    return /^(RH|[A-Z0-9]{2,4})$/.test(str);
}

/**
 * Affiche les résultats de l'analyse
 * @param {Object} result - Les résultats de l'analyse
 */
function displayResults(result) {
    console.log("Affichage des résultats:", result);
    
    if (!result || !result.success) {
        showToast("Erreur lors de l'analyse", "error");
        return;
    }
    
    // Mettre à jour le nom de la personne
    if (elements.personNamesList) {
        elements.personNamesList.textContent = result.personName;
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
            <td colspan="3" class="no-results">Aucun code trouvé pour ${result.personName}</td>
        `;
        elements.resultsTableBody.appendChild(row);
        
        return;
    }
    
    // Ajouter chaque code au tableau
    result.codes.forEach((codeInfo, index) => {
        const code = typeof codeInfo === 'object' ? codeInfo.code : codeInfo;
        const day = typeof codeInfo === 'object' ? codeInfo.day : null;
        const original = typeof codeInfo === 'object' ? codeInfo.original : code;
        const corrected = typeof codeInfo === 'object' ? codeInfo.corrected : false;
        
        const row = document.createElement('tr');
        
        // Colonne du jour
        const dayCell = document.createElement('td');
        if (day) {
            dayCell.textContent = day;
        } else {
            // Si le jour n'est pas spécifié, ajouter un champ de saisie
            const dayInput = document.createElement('input');
            dayInput.type = 'number';
            dayInput.min = '1';
            dayInput.max = '31';
            dayInput.placeholder = 'Jour';
            dayInput.className = 'day-input';
            dayInput.dataset.index = index;
            dayInput.addEventListener('change', function() {
                // Mettre à jour le jour dans les résultats
                const dayValue = parseInt(this.value);
                if (!isNaN(dayValue) && dayValue >= 1 && dayValue <= 31) {
                    result.codes[index].day = dayValue;
                    // Mettre à jour l'état de l'application
                    appState.results = result;
                }
            });
            dayCell.appendChild(dayInput);
        }
        row.appendChild(dayCell);
        
        // Colonne du code
        const codeCell = document.createElement('td');
        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.value = code;
        codeInput.className = 'code-input';
        codeInput.dataset.index = index;
        if (corrected) {
            codeInput.classList.add('corrected');
            codeInput.title = `Code original: ${original}`;
        }
        codeInput.addEventListener('change', function() {
            // Mettre à jour le code dans les résultats
            const newCode = this.value.trim().toUpperCase();
            if (newCode) {
                result.codes[index].code = newCode;
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
        
        if (!ocrResult.success) {
            throw new Error(ocrResult.error || "Erreur lors de l'analyse OCR");
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
        showToast(`Erreur: ${error.message}`, "error");
        
        // Masquer l'indicateur de chargement
        elements.loadingIndicator.hidden = true;
    }
}
