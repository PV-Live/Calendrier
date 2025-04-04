/**
 * ocr-analysis.js
 * Analyse OCR et traitement du texte pour l'application Calendrier CHAL
 */

/**
 * Analyse le planning pour le nom sélectionné
 * @async
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
        const result = await analyzeOcrText(ocrResult.ocrText, personName, month, year);
        
        // S'assurer que le résultat a la propriété found définie à true
        if (result && !result.found && result.codes && result.codes.some(code => code)) {
            console.log("Résultats trouvés mais la propriété found est false, correction...");
            result.found = true;
        }
        
        // Mettre à jour l'état de l'application
        appState.results = result;
        appState.isAnalyzing = false;
        
        // S'assurer que le loader est bien masqué avant d'afficher les résultats
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

/**
 * Analyse le texte OCR pour extraire les codes d'une personne spécifique
 * @param {string} ocrText - Texte OCR
 * @param {string} personName - Nom de la personne
 * @param {number} month - Mois (1-12)
 * @param {number} year - Année
 * @returns {Promise<Object>} - Résultat de l'analyse
 */
async function analyzeOcrText(ocrText, personName, month = getCurrentMonth(), year = getCurrentYear()) {
    console.log("Analyse du texte OCR:", ocrText);
    
    // Nettoyer le texte OCR
    ocrText = cleanOcrText(ocrText);
    
    // Vérifier si le texte est au format Markdown (tableau)
    const isMarkdownTable = ocrText.includes('|');
    
    // Calculer le nombre de jours dans le mois
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Initialiser le résultat
    const result = {
        found: false,
        name: personName,
        codes: Array(daysInMonth).fill(''),
        rawText: ocrText,
        month: month,
        year: year
    };
    
    try {
        // Traiter le texte OCR en fonction du format
        if (isMarkdownTable) {
            console.log("Format détecté: Tableau Markdown");
            
            // Diviser le texte en lignes
            const lines = ocrText.split('\n').filter(line => line.trim() !== '');
            
            // Chercher la ligne contenant le nom de la personne
            let personLine = null;
            let personLineIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Vérifier si la ligne contient le nom de la personne
                if (line.toLowerCase().includes(personName.toLowerCase())) {
                    personLine = line;
                    personLineIndex = i;
                    break;
                }
            }
            
            if (personLine) {
                console.log(`Ligne trouvée pour ${personName}:`, personLine);
                
                // Extraire les codes de la ligne
                const cells = personLine.split('|').map(cell => cell.trim());
                
                // Supprimer les cellules vides au début et à la fin
                if (cells[0] === '') cells.shift();
                if (cells[cells.length - 1] === '') cells.pop();
                
                console.log("Cellules extraites:", cells);
                
                // La première cellule contient généralement le nom
                // La deuxième cellule contient généralement le pourcentage
                // Les cellules suivantes contiennent les codes
                
                // Extraire les codes en commençant par la troisième cellule
                const codes = [];
                
                for (let i = 2; i < cells.length && codes.length < daysInMonth; i++) {
                    let code = cells[i];
                    
                    // Supprimer les caractères de mise en forme Markdown (**, __, etc.)
                    code = code.replace(/\*\*/g, '').replace(/__/g, '').trim();
                    
                    // Vérifier si le code est valide
                    if (isValidCode(code)) {
                        codes.push(code);
                    } else {
                        // Essayer de trouver un code similaire
                        const similarCode = findMostSimilarCode(code, appState.validCodes);
                        
                        if (similarCode) {
                            console.log(`Code corrigé: ${code} -> ${similarCode}`);
                            codes.push(similarCode);
                        } else {
                            codes.push('');
                        }
                    }
                }
                
                console.log("Codes extraits:", codes);
                
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
            console.log("Format détecté: Texte brut");
            
            // Diviser le texte en lignes
            const lines = ocrText.split('\n').filter(line => line.trim() !== '');
            
            // Chercher la ligne contenant le nom de la personne
            let personLineIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Vérifier si la ligne contient le nom de la personne
                if (line.toLowerCase().includes(personName.toLowerCase())) {
                    personLineIndex = i;
                    break;
                }
            }
            
            if (personLineIndex >= 0) {
                console.log(`Ligne trouvée pour ${personName} à l'index ${personLineIndex}`);
                
                // Extraire les codes des lignes suivantes
                const codes = [];
                
                // Parcourir les lignes suivantes pour extraire les codes
                for (let i = personLineIndex + 1; i < lines.length && codes.length < daysInMonth; i++) {
                    const line = lines[i];
                    
                    // Diviser la ligne en mots
                    const words = line.split(/\s+/);
                    
                    // Parcourir les mots pour trouver des codes valides
                    for (const word of words) {
                        // Nettoyer le mot
                        const cleanWord = word.replace(/[^A-Za-z0-9]/g, '');
                        
                        // Vérifier si le mot est un code valide
                        if (isValidCode(cleanWord)) {
                            codes.push(cleanWord);
                            
                            // Arrêter si on a assez de codes
                            if (codes.length >= daysInMonth) {
                                break;
                            }
                        } else if (cleanWord.length >= 2 && cleanWord.length <= 4) {
                            // Essayer de trouver un code similaire
                            const similarCode = findMostSimilarCode(cleanWord, appState.validCodes);
                            
                            if (similarCode) {
                                console.log(`Code corrigé: ${cleanWord} -> ${similarCode}`);
                                codes.push(similarCode);
                                
                                // Arrêter si on a assez de codes
                                if (codes.length >= daysInMonth) {
                                    break;
                                }
                            }
                        }
                    }
                }
                
                console.log("Codes extraits:", codes);
                
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
