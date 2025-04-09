/**
 * ocr-analysis.js
 * Analyse OCR et traitement du texte pour l'application Calendrier CHAL
 */

/**
 * Analyse le planning pour le nom sélectionné
 * @async
 */
async function analyzeSchedule() {
    /*console.log("Analyse du planning..."); */
    
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
    
    // Afficher la section des résultats
    if (elements.resultsSection) {
        elements.resultsSection.hidden = false;
    }
    
    // Masquer la section des résultats précédents
    if (elements.resultsContent) {
        elements.resultsContent.hidden = true;
    }
    
    // Afficher l'indicateur de chargement
    if (elements.loadingIndicator) {
        elements.loadingIndicator.hidden = false;
    }
    
    try {
        // Charger les paramètres API
        /*console.log("Chargement des paramètres API pour l'analyse...");*/
        await loadApiSettings();
        
        const apiKey = appState.apiSettings && appState.apiSettings.apiKey;
        const strictMode = appState.apiSettings && appState.apiSettings.strictMode !== false;
        /*
        console.log("Paramètres API chargés pour l'analyse:", {
            hasApiKey: !!apiKey,
            strictMode
        }); */
        
        if (!apiKey) {
            showToast("Veuillez configurer votre clé API dans les paramètres ou utiliser la saisie manuelle", "warning");
            
            // Ouvrir automatiquement l'interface de saisie manuelle
           /* console.log("Aucune clé API configurée, ouverture de l'interface de saisie manuelle");*/
            
            // Vérifier si la fonction showCalendarWithManualEntry est disponible
            if (typeof showCalendarWithManualEntry === 'function') {
                // Utiliser setTimeout pour laisser le temps au toast de s'afficher
                setTimeout(() => {
                    showCalendarWithManualEntry();
                }, 500);
            } else {
                console.error("La fonction showCalendarWithManualEntry n'est pas disponible");
            }
            
            return;
        }
        
        // Analyser l'image avec Google Vision
        /*console.log("Analyse de l'image avec Google Vision...");
        console.log("Utilisation de la clé API:", apiKey ? "Présente" : "Manquante");*/
        
        const ocrResult = await analyzeImageWithGoogleVision(appState.imageFile, apiKey);
        
        if (!ocrResult.success) {
            showToast("Erreur lors de l'analyse de l'image: " + ocrResult.error, "error");
            return;
        }
        
        /*console.log("Résultat OCR obtenu:", ocrResult);*/
        
        // Analyser le texte OCR
        /*console.log(`Analyse du texte OCR pour ${personName}...`);*/
        const result = await analyzeOcrText(ocrResult.ocrText, personName, month, year);
        
        // Mettre à jour l'état de l'application avec les résultats
        appState.results = result;
        
        // Masquer l'indicateur de chargement
        if (elements.loadingIndicator) {
            elements.loadingIndicator.hidden = true;
        }
        
        if (result.found) {
            // Afficher les résultats directement dans le calendrier
            displayResults(result);
            
            // Afficher également les codes dans la section "Résultat de l'analyse IA"
            if (elements.resultsSection) {
                // Créer ou mettre à jour la section "Résultat de l'analyse IA"
                let resultSection = document.getElementById('iaResultSection');
                
                if (!resultSection) {
                    // Créer la section si elle n'existe pas
                    resultSection = document.createElement('div');
                    resultSection.id = 'iaResultSection';
                    resultSection.className = 'card-section';
                    
                    // Créer le titre
                    const title = document.createElement('h3');
                    title.textContent = 'Analyse IA';
                    resultSection.appendChild(title);
                    
                    // Créer l'avertissement
                    const warning = document.createElement('p');
                    warning.className = 'ocr-warning';
                    warning.textContent = 'Attention le résultat peut comporter des erreurs.';
                    resultSection.appendChild(warning);
                    
                    // Créer le conteneur pour les codes
                    const codesContainer = document.createElement('div');
                    codesContainer.className = 'ocr-result-container';
                    
                    // Créer la zone de texte pour les codes (modifiable)
                    const codesTextarea = document.createElement('textarea');
                    codesTextarea.id = 'iaResultText';
                    codesTextarea.className = 'ocr-result-text';
                    codesTextarea.readOnly = false; // Rendre modifiable
                    codesContainer.appendChild(codesTextarea);
                    
                    resultSection.appendChild(codesContainer);
                    
                    // Créer le bouton de mise à jour
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'button-group';
                    
                    const updateButton = document.createElement('button');
                    updateButton.id = 'updateCodesButton';
                    updateButton.className = 'button button-primary';
                    updateButton.textContent = 'Mettre à jour';
                    buttonContainer.appendChild(updateButton);
                    
                    resultSection.appendChild(buttonContainer);
                    
                    // Ajouter la section avant le calendrier
                    const calendarContainer = document.getElementById('calendarContainer');
                    if (calendarContainer && calendarContainer.parentNode) {
                        calendarContainer.parentNode.insertBefore(resultSection, calendarContainer);
                    }
                    
                    // Ajouter l'événement de clic au bouton de mise à jour
                    updateButton.addEventListener('click', function() {
                        // Récupérer les codes modifiés
                        const modifiedCodes = codesTextarea.value.trim().split(/\s+/);
                        
                        // Normaliser les codes en majuscules
                        const normalizedCodes = modifiedCodes.map(code => window.normalizeCode(code));
                        
                        // Mettre à jour le résultat
                        result.codes = normalizedCodes;
                        
                        // Mettre à jour l'état de l'application
                        appState.results = result;
                        
                        // Mettre à jour l'affichage
                        displayResults(result);
                        
                        // Afficher un message de succès
                        showToast('Codes mis à jour avec succès', 'success');
                    });
                }
                
                // Mettre à jour le contenu de la zone de texte
                const codesTextarea = document.getElementById('iaResultText');
                if (codesTextarea) {
                    // Formater les codes pour l'affichage (séparés par des espaces)
                    const formattedCodes = result.codes.join(' ');
                    codesTextarea.value = formattedCodes;
                }
            }
        } else {
            showToast(`Aucun résultat trouvé pour ${personName}`, "error");
        }
        
        /*console.log("Analyse terminée avec succès"); */
        showToast("Analyse terminée avec succès", "success");
        
    } catch (error) {
        console.error("Erreur lors de l'analyse du planning:", error);
        showToast("Erreur lors de l'analyse: " + error.message, "error");
        
        // Masquer l'indicateur de chargement en cas d'erreur
        if (elements.loadingIndicator) {
            elements.loadingIndicator.hidden = true;
        }
    }
}

/**
 * Analyse le texte OCR pour extraire les codes d'une personne spécifique
 * @param {string} ocrText - Texte OCR
 * @param {string} personName - Nom de la personne
 * @param {number} month - Mois (1-12)
 * @param {number} year - Année
 * @returns {Promise<Object>} - Résultat de l'analyse
 */
async function analyzeOcrText(ocrText, personName, month = getCurrentMonth(), year = getCurrentYear()) {
    /*console.log("Analyse du texte OCR:", ocrText);*/
    
    // Nettoyer le texte OCR
    ocrText = cleanOcrText(ocrText);
    
    // Vérifier si le texte est au format Markdown (tableau)
    const isMarkdownTable = ocrText.includes('|') && (ocrText.includes('---') || ocrText.includes('**'));
    
    // Calculer le nombre de jours dans le mois
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Initialiser le résultat
    const result = {
        found: false,
        name: personName,
        codes: Array(daysInMonth).fill(''),
        rawText: ocrText,
        month: month,
        year: year,
        personLine: '' // Nouvelle propriété pour stocker la ligne de la personne
    };
    
    try {
        // Normaliser le nom de la personne pour la recherche (convertir en majuscules et supprimer les accents)
        const normalizedPersonName = personName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Diviser le texte en lignes
        const lines = ocrText.split('\n').filter(line => line.trim() !== '');
        
        // Traiter le texte OCR en fonction du format
        if (isMarkdownTable) {
            /*console.log("Format détecté: Tableau Markdown");*/
            
            // Chercher la ligne contenant le nom de la personne
            let personLine = null;
            let personLineIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const normalizedLine = line.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                // Vérifier si la ligne contient le nom de la personne
                if (normalizedLine.includes(normalizedPersonName)) {
                    personLine = line;
                    personLineIndex = i;
                    break;
                }
            }
            
            if (personLine) {
                /*console.log(`Ligne trouvée pour ${personName}:`, personLine);*/
                result.personLine = personLine;
                
                // Extraire les codes de la ligne
                const cells = personLine.split('|').map(cell => cell.trim());
                
                // Supprimer les cellules vides au début et à la fin
                if (cells[0] === '') cells.shift();
                if (cells[cells.length - 1] === '') cells.pop();
                
                /*console.log("Cellules extraites:", cells);*/
                
                // La première cellule contient généralement le nom
                // La deuxième cellule contient généralement le pourcentage
                // Les cellules suivantes contiennent les codes
                
                // Extraire les codes en commençant par la troisième cellule
                const codes = [];
                
                for (let i = 2; i < cells.length && codes.length < daysInMonth; i++) {
                    let code = cells[i];
                    
                    // Supprimer les caractères de mise en forme Markdown (**, __, etc.)
                    code = code.replace(/\*\*/g, '').replace(/__/g, '').trim();
                    
                    // Normaliser le code en majuscules
                    code = window.normalizeCode(code);
                    
                    // Vérifier si le code est valide
                    if (isValidCode(code)) {
                        codes.push(code);
                    } else {
                        // Essayer de trouver un code similaire
                        const similarCode = findMostSimilarCode(code, appState.validCodes);
                        
                        if (similarCode) {
                            /* console.log(`Code corrigé: ${code} -> ${similarCode}`); */
                            codes.push(similarCode);
                        } else {
                            codes.push('');
                        }
                    }
                }
                
                /*console.log("Codes extraits:", codes);*/
                
                // Compléter ou tronquer les codes si nécessaire
                if (codes.length < daysInMonth) {
                    console.log(`Complétion des codes manquants (${codes.length} -> ${daysInMonth})`);
                    while (codes.length < daysInMonth) {
                        codes.push('');
                    }
                } else if (codes.length > daysInMonth) {
                    console.log(`Troncature des codes excédentaires (${codes.length} -> ${daysInMonth})`);
                    codes.splice(daysInMonth);
                }
                
                // Mettre à jour le résultat
                result.found = true;
                result.codes = codes;
            } else {
                console.log(`Personne non trouvée: ${personName}`);
            }
        } else {
            /*console.log("Format détecté: Texte brut");*/
            
            // Chercher la ligne contenant le nom de la personne
            let personLineIndex = -1;
            let personLine = "";
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const normalizedLine = line.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                // Vérifier si la ligne contient le nom de la personne
                if (normalizedLine.includes(normalizedPersonName)) {
                    personLineIndex = i;
                    personLine = line;
                   /* console.log(`Ligne trouvée pour ${personName} à l'index ${personLineIndex}: ${line}`); */
                    break;
                }
            }
            
            if (personLineIndex >= 0) {
                // Stocker la ligne complète de la personne
                result.personLine = personLine;
                
                // Extraire les codes de la ligne de la personne et des lignes suivantes
                const codes = [];
                
                // Récupérer d'abord les codes sur la ligne de la personne
                // (après le nom et prénom)
                const personLineParts = personLine.split(/\s+/);
                
                // Ignorer le nom et le prénom (généralement les premiers mots)
                // et chercher des codes valides dans le reste de la ligne
                let skipWords = 0;
                
                // Déterminer combien de mots à sauter (nom et prénom)
                for (let i = 0; i < personLineParts.length; i++) {
                    const normalizedPart = personLineParts[i].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (normalizedPersonName.includes(normalizedPart)) {
                        skipWords = i + 1;
                    }
                }
                
                // Chercher des codes dans le reste de la ligne
                for (let i = skipWords; i < personLineParts.length; i++) {
                    const word = personLineParts[i].trim();
                    const cleanWord = word.replace(/[^A-Za-z0-9]/g, '');
                    
                    // Ignorer les pourcentages et les mots trop courts
                    if (cleanWord.includes('%') || cleanWord.length < 2) {
                        continue;
                    }
                    
                    // Normaliser le code en majuscules
                    const normalizedWord = window.normalizeCode(cleanWord);
                    
                    // Vérifier si le mot est un code valide
                    if (isValidCode(normalizedWord)) {
                        codes.push(normalizedWord);
                    } else if (cleanWord.length >= 2 && cleanWord.length <= 4) {
                        // Essayer de trouver un code similaire
                        const similarCode = findMostSimilarCode(normalizedWord, appState.validCodes);
                        
                        if (similarCode) {
                            /* console.log(`Code corrigé: ${cleanWord} -> ${similarCode}`); */
                            codes.push(similarCode);
                        }
                    }
                }
                
                // Parcourir les lignes suivantes pour extraire plus de codes
                for (let i = personLineIndex + 1; i < lines.length && codes.length < daysInMonth; i++) {
                    const line = lines[i];
                    
                    // Si on trouve une autre personne, arrêter l'extraction
                    if (i > personLineIndex + 3) {  // Vérifier après quelques lignes
                        const normalizedLine = line.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        // Vérifier si la ligne contient un nom de personne (généralement suivi de "SF" ou d'un pourcentage)
                        if ((normalizedLine.includes("SF") || normalizedLine.includes("%")) && 
                            !normalizedLine.includes(normalizedPersonName)) {
                            /*console.log(`Détection d'une autre personne à la ligne ${i}, arrêt de l'extraction`);*/
                            break;
                        }
                    }
                    
                    // Diviser la ligne en mots
                    const words = line.split(/\s+/);
                    
                    // Parcourir les mots pour trouver des codes valides
                    for (const word of words) {
                        // Nettoyer le mot
                        const cleanWord = word.replace(/[^A-Za-z0-9]/g, '');
                        
                        // Ignorer les pourcentages et les mots trop courts
                        if (cleanWord.includes('%') || cleanWord.length < 2) {
                            continue;
                        }
                        
                        // Normaliser le code en majuscules
                        const normalizedWord = window.normalizeCode(cleanWord);
                        
                        // Vérifier si le mot est un code valide
                        if (isValidCode(normalizedWord)) {
                            codes.push(normalizedWord);
                            
                            // Arrêter si on a assez de codes
                            if (codes.length >= daysInMonth) {
                                break;
                            }
                        } else if (cleanWord.length >= 2 && cleanWord.length <= 4) {
                            // Essayer de trouver un code similaire
                            const similarCode = findMostSimilarCode(normalizedWord, appState.validCodes);
                            
                            if (similarCode) {
                                /* console.log(`Code corrigé: ${cleanWord} -> ${similarCode}`); */
                                codes.push(similarCode);
                                
                                // Arrêter si on a assez de codes
                                if (codes.length >= daysInMonth) {
                                    break;
                                }
                            }
                        }
                    }
                }
                
                 /* console.log("Codes extraits:", codes); */
                
                // Compléter ou tronquer les codes si nécessaire
                if (codes.length < daysInMonth) {
                   /* console.log(`Complétion des codes manquants (${codes.length} -> ${daysInMonth})`); */
                    while (codes.length < daysInMonth) {
                        codes.push('');
                    }
                } else if (codes.length > daysInMonth) {
                   /* console.log(`Troncature des codes excédentaires (${codes.length} -> ${daysInMonth})`); */
                    codes.splice(daysInMonth);
                }
                
                // Mettre à jour le résultat
                result.found = true;
                result.codes = codes;
            } else {
                console.log(`Personne non trouvée: ${personName}`);
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'analyse du texte OCR:", error);
    }
    
    return result;
}

/**
 * Nettoie le texte OCR
 * @param {string} ocrText - Texte OCR
 * @returns {string} - Texte OCR nettoyé
 */
function cleanOcrText(ocrText) {
    // Supprimer les caractères spéciaux et les espaces multiples
    return ocrText
        .replace(/\r/g, '')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Retourne le mois actuel (1-12)
 * @returns {number} - Mois actuel
 */
function getCurrentMonth() {
    return new Date().getMonth() + 1;
}

/**
 * Retourne l'année actuelle
 * @returns {number} - Année actuelle
 */
function getCurrentYear() {
    return new Date().getFullYear();
}

// Exposer les fonctions au niveau global
window.analyzeSchedule = analyzeSchedule;
window.analyzeOcrText = analyzeOcrText;
window.cleanOcrText = cleanOcrText;
window.getCurrentMonth = getCurrentMonth;
window.getCurrentYear = getCurrentYear;
