/**
 * Calendrier Leo - Module API Mistral OCR
 * Gère les appels à l'API Mistral OCR pour l'analyse des images
 */

// Configuration de l'API Mistral
const MISTRAL_API_CONFIG = {
    apiKey: '', // La clé API doit être configurée via la page des paramètres
    endpoint: 'https://api.mistral.ai/v1/ocr', // Endpoint de l'API OCR de Mistral
    model: 'mistral-ocr-latest' // Modèle OCR à utiliser (latest est le modèle recommandé)
};

/**
 * Analyse une image avec l'API Mistral OCR et retourne le texte brut
 * 
 * @param {File} imageFile - Fichier image à analyser
 * @param {string} apiKey - Clé API Mistral
 * @returns {Promise<Object>} - Résultat brut de l'analyse OCR
 */
async function analyzeImageWithMistralOCR(imageFile, apiKey) {
    console.log('=== DÉBUT ANALYSE MISTRAL OCR ===');
    console.log(`Type de fichier: ${imageFile.type}, Taille: ${Math.round(imageFile.size / 1024)} KB`);
    
    try {
        // Vérifier si la clé API est fournie
        if (!apiKey) {
            console.warn('Aucune clé API fournie, utilisation du mode démo');
            return {
                success: true,
                ocrText: "Mode démo - Texte OCR simulé",
                rawResponse: { demo: true }
            };
        }
        
        // Configurer l'API
        MISTRAL_API_CONFIG.apiKey = apiKey;
        console.log(`Clé API configurée: ${apiKey.substring(0, 4)}...`);
        
        // Forcer le modèle OCR pour la compatibilité
        const modelToUse = "mistral-ocr-latest";
        console.log(`Modèle OCR: ${modelToUse} (forcé pour compatibilité)`);
        
        // Redimensionner l'image si nécessaire
        const resizedImage = await resizeImageIfNeeded(imageFile);
        
        // Convertir l'image en base64
        console.log("Conversion de l'image en base64...");
        const base64Image = await convertImageToBase64(resizedImage);
        console.log(`Image convertie en base64 (longueur: ${base64Image.length} caractères)`);
        
        // Préparer les données de la requête - Structure simple selon la documentation
        const requestData = {
            model: modelToUse,
            document: {
                type: "image_url",
                image_url: `data:${resizedImage.type};base64,${base64Image}`
            }
        };
        
        // Afficher les détails de la requête (sans l'image complète)
        console.log("Détails de la requête:", {
            model: requestData.model,
            document: {
                type: requestData.document.type,
                image_url: `data:${resizedImage.type};base64,[BASE64_DATA]`
            }
        });
        
        // Envoyer la requête à l'API
        console.log('Envoi de la requête à l\'API Mistral OCR...');
        const response = await fetch(MISTRAL_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestData)
        });
        
        // Vérifier si la requête a réussi
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Erreur API (${response.status}):`, errorData);
            throw new Error(`Erreur API: ${response.status} - ${errorData.error?.message || 'Erreur inconnue'}`);
        }
        
        // Récupérer la réponse
        const data = await response.json();
        console.log('Réponse de l\'API reçue');
        console.log('Réponse complète:', JSON.stringify(data, null, 2));
        
        // Extraire le texte OCR
        let ocrText = '';
        if (data.pages && data.pages.length > 0) {
            // Extraire le texte de chaque page
            for (const page of data.pages) {
                if (page.markdown) {
                    ocrText += page.markdown + '\n\n';
                } else if (page.text) {
                    ocrText += page.text + '\n\n';
                }
            }
        } else if (data.text) {
            ocrText = data.text;
        } else if (data.content) {
            ocrText = data.content;
        } else {
            ocrText = JSON.stringify(data, null, 2);
        }
        
        console.log('Texte OCR extrait:', ocrText);
        console.log('=== FIN ANALYSE MISTRAL OCR (SUCCÈS) ===');
        
        return {
            success: true,
            ocrText: ocrText,
            rawResponse: data
        };
    } catch (error) {
        console.error('Erreur lors de l\'analyse OCR:', error);
        console.log('=== FIN ANALYSE MISTRAL OCR (AVEC ERREUR) ===');
        
        return {
            success: false,
            error: error.message,
            rawResponse: null
        };
    }
}

/**
 * Liste des codes valides pour la correction
 * Cette liste peut être mise à jour via les paramètres de l'application
 */
let VALID_CODES = ['J8D', 'M7M', 'C9E', 'RH', 'JPY', 'JPC', 'SFC', 'NZH', 'RC'];

/**
 * Charge les codes valides depuis le localStorage
 */
function loadValidCodes() {
    const savedCodes = localStorage.getItem('validCodes');
    if (savedCodes) {
        try {
            VALID_CODES = JSON.parse(savedCodes);
            console.log(`${VALID_CODES.length} codes valides chargés depuis le localStorage`);
        } catch (error) {
            console.error('Erreur lors du chargement des codes valides:', error);
        }
    }
}

/**
 * Sauvegarde les codes valides dans le localStorage
 */
function saveValidCodes() {
    localStorage.setItem('validCodes', JSON.stringify(VALID_CODES));
    console.log(`${VALID_CODES.length} codes valides sauvegardés dans le localStorage`);
}

/**
 * Ajoute un code valide à la liste
 * @param {string} code - Code à ajouter
 * @returns {boolean} - true si le code a été ajouté, false sinon
 */
function addValidCode(code) {
    code = code.trim().toUpperCase();
    
    if (!code) {
        return false;
    }
    
    if (VALID_CODES.includes(code)) {
        return false;
    }
    
    VALID_CODES.push(code);
    saveValidCodes();
    return true;
}

/**
 * Supprime un code valide de la liste
 * @param {string} code - Code à supprimer
 * @returns {boolean} - true si le code a été supprimé, false sinon
 */
function removeValidCode(code) {
    const index = VALID_CODES.indexOf(code);
    
    if (index === -1) {
        return false;
    }
    
    VALID_CODES.splice(index, 1);
    saveValidCodes();
    return true;
}

/**
 * Corrige un code en fonction des codes valides
 * @param {string} code - Code à corriger
 * @returns {string} - Code corrigé
 */
function correctCode(code) {
    if (!code) return code;
    
    // Normaliser le code
    code = code.trim().toUpperCase();
    
    // Si le code est déjà valide, le retourner tel quel
    if (VALID_CODES.includes(code)) {
        return code;
    }
    
    // Vérifier si le code est proche d'un code valide
    let bestMatch = null;
    let bestScore = 0;
    
    for (const validCode of VALID_CODES) {
        const score = similarityScore(code, validCode);
        
        if (score > bestScore && score > 0.6) { // Seuil de similarité à 60%
            bestScore = score;
            bestMatch = validCode;
        }
    }
    
    // Si un code similaire a été trouvé, le retourner
    if (bestMatch) {
        console.log(`Code corrigé: ${code} -> ${bestMatch} (score: ${bestScore.toFixed(2)})`);
        return bestMatch;
    }
    
    // Sinon, retourner le code original
    return code;
}

/**
 * Calcule la similarité entre deux chaînes (0-1)
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Score de similarité (0-1)
 */
function calculateSimilarity(str1, str2) {
    // Méthode simple basée sur la distance de Levenshtein
    const longer = str1.length >= str2.length ? str1 : str2;
    const shorter = str1.length >= str2.length ? str2 : str1;
    
    if (longer.length === 0) {
        return 1.0;
    }
    
    // Calculer la distance de Levenshtein
    const distance = levenshteinDistance(longer, shorter);
    
    // Normaliser la distance
    return (longer.length - distance) / longer.length;
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
    
    // Créer une matrice de taille (m+1) x (n+1)
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialiser la première colonne et la première ligne
    for (let i = 0; i <= m; i++) {
        d[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
        d[0][j] = j;
    }
    
    // Remplir la matrice
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
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
 * Traite le texte OCR pour une personne spécifique
 * 
 * @param {string} ocrText - Texte OCR brut
 * @param {string} personName - Nom de la personne à rechercher
 * @returns {Object} - Résultat du traitement
 */
function processOcrTextForPerson(ocrText, personName) {
    console.log(`Traitement du texte OCR pour la personne: ${personName}`);
    
    // Si aucun texte n'est fourni, retourner un résultat vide
    if (!ocrText) {
        console.log('Aucun texte OCR fourni');
        return { 
            success: true, 
            ocrText: '', 
            personName: personName,
            days: [],
            codes: []
        };
    }
    
    // Normaliser le nom pour la recherche
    const searchName = personName.trim().toUpperCase();
    console.log(`Nom normalisé pour la recherche: ${searchName}`);
    
    // Diviser le texte en lignes
    const lines = ocrText.split('\n');
    console.log(`Texte OCR divisé en ${lines.length} lignes`);
    
    // Afficher toutes les lignes pour le débogage
    console.log("Toutes les lignes du texte OCR:");
    lines.forEach((line, index) => {
        console.log(`Ligne ${index + 1}: ${line}`);
    });
    
    // Rechercher les lignes qui contiennent le nom de la personne
    const matchingLines = lines.filter(line => 
        line.toUpperCase().includes(searchName)
    );
    
    if (matchingLines.length === 0) {
        console.log(`Aucune ligne trouvée pour la personne: ${personName}`);
        
        // Vérifier si le texte est au format tableau Markdown
        if (ocrText.includes('|')) {
            console.log("Format tableau Markdown détecté, traitement spécial...");
            
            // Extraire les cellules du tableau
            const cells = [];
            lines.forEach(line => {
                if (line.includes('|')) {
                    const rowCells = line.split('|')
                        .map(cell => cell.trim())
                        .filter(cell => cell !== '');
                    cells.push(...rowCells);
                }
            });
            
            // Rechercher des cellules qui contiennent le nom de la personne
            const matchingCells = cells.filter(cell => 
                cell.toUpperCase().includes(searchName)
            );
            
            if (matchingCells.length > 0) {
                console.log(`Cellules trouvées pour la personne: ${matchingCells.length}`);
                matchingLines.push(...matchingCells);
            }
        }
    }
    
    // Si aucune ligne ne correspond, retourner un résultat vide
    if (matchingLines.length === 0) {
        console.log("Aucun code trouvé, analyse manuelle du texte OCR...");
        
        // Extraire tous les codes du texte OCR
        const allCodes = [];
        const codeRegex = /\b([A-Z][0-9][A-Z]|[A-Z][0-9][0-9]|[A-Z][A-Z][A-Z]|[A-Z][A-Z][0-9]|RH|[0-9]{2,3}%)\b/g;
        
        lines.forEach(line => {
            const matches = line.match(codeRegex);
            if (matches) {
                allCodes.push(...matches);
            }
        });
        
        // Éliminer les doublons
        const uniqueCodes = [...new Set(allCodes)];
        console.log(`${uniqueCodes.length} codes extraits au total`);
        
        return {
            success: true,
            ocrText: ocrText,
            personName: personName,
            days: Array.from({ length: 31 }, (_, i) => i + 1),
            codes: uniqueCodes
        };
    }
    
    // Analyser les lignes correspondantes
    let allCodes = [];
    
    matchingLines.forEach(line => {
        console.log(`Analyse de la ligne: ${line}`);
        
        // Extraire les codes de la ligne
        const codeRegex = /\b([A-Z][0-9][A-Z]|[A-Z][0-9][0-9]|[A-Z][A-Z][A-Z]|[A-Z][A-Z][0-9]|RH|[0-9]{2,3}%)\b/g;
        const matches = line.match(codeRegex);
        
        if (matches) {
            console.log(`${matches.length} codes trouvés:`, matches);
            allCodes.push(...matches);
        } else {
            console.log("Aucun code trouvé dans cette ligne");
        }
    });
    
    // Éliminer les doublons
    const uniqueCodes = [...new Set(allCodes)];
    
    // Corriger les codes
    const correctedCodes = uniqueCodes.map(code => correctCode(code));
    
    return {
        success: true,
        ocrText: ocrText,
        personName: personName,
        days: Array.from({ length: 31 }, (_, i) => i + 1),
        codes: correctedCodes
    };
}

/**
 * Extrait les noms et codes à partir du texte OCR
 * @param {string} ocrText - Le texte brut extrait par l'OCR
 * @returns {Array} - Un tableau d'objets {nom, codes}
 */
function extractNamesAndCodesFromOCR(ocrText) {
    console.log("Extraction des noms et codes à partir du texte OCR");
    
    // Si aucun texte n'est fourni, retourner un tableau vide
    if (!ocrText || typeof ocrText !== 'string') {
        console.error("Aucun texte OCR valide fourni");
        return [];
    }
    
    // Vérifier si le texte est au format tableau Markdown (contient des |)
    const isMarkdownTable = ocrText.includes('|');
    
    let lines = [];
    if (isMarkdownTable) {
        console.log("Format tableau Markdown détecté, traitement spécial...");
        
        // Diviser le texte en lignes
        const rawLines = ocrText.split('\n').filter(line => line.trim() !== '');
        
        // Pour chaque ligne de tableau, extraire les cellules
        for (const rawLine of rawLines) {
            // Diviser la ligne en cellules (séparées par |)
            const cells = rawLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            console.log(`Cellules extraites: ${cells.length}`);
            
            // Ajouter chaque cellule comme une "ligne" pour l'analyse
            lines = lines.concat(cells);
        }
    } else {
        // Traitement normal pour le texte non tabulaire
        lines = ocrText.split('\n').filter(line => line.trim() !== '');
    }
    
    console.log(`Nombre d'éléments à analyser: ${lines.length}`);
    console.log("Éléments à analyser:", lines);
    
    const namesAndCodes = [];
    const codeRegex = /\b([A-Z][0-9][A-Z]|[A-Z][0-9][0-9]|[A-Z][A-Z][A-Z]|[A-Z][A-Z][0-9])\b/g;
    
    // Parcourir chaque élément pour trouver les noms et codes
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Ignorer les éléments trop courts ou qui ne contiennent pas de lettres
        if (line.length < 3 || !/[a-zA-Z]/.test(line)) {
            continue;
        }
        
        // Rechercher les motifs qui ressemblent à des noms (en majuscules)
        // Adapter le pattern pour capturer aussi les noms comme "CANTICLAIRE"
        const nameMatch = line.match(/([A-Z][A-Z\-]+(?:\s+[A-Z][a-zA-Zéèêëàâäôöûüç\-]+)?)/);
        
        if (nameMatch) {
            const name = nameMatch[1].trim();
            
            // Cas spécial pour certains codes connus
            if (name === "RH" || name === "300%" || name === "400%" || name === "50%" || name === "60%") {
                // Ces éléments sont probablement des codes, pas des noms
                continue;
            }
            
            // Rechercher les codes dans tous les éléments
            let codes = [];
            
            // Chercher dans tous les éléments pour les codes associés à ce nom
            for (const item of lines) {
                const itemCodes = item.match(codeRegex) || [];
                for (const code of itemCodes) {
                    if (!codes.includes(code)) {
                        codes.push(code);
                    }
                }
            }
            
            // Corriger les codes
            const correctedCodes = codes.map(code => correctCode(code));
            
            namesAndCodes.push({
                nom: name,
                codes: correctedCodes
            });
            
            console.log(`Nom trouvé: ${name}, Codes: ${correctedCodes.length > 0 ? correctedCodes.join(', ') : 'aucun'}`);
        }
    }
    
    console.log(`Total des noms extraits: ${namesAndCodes.length}`);
    return namesAndCodes;
}

/**
 * Traite un tableau Markdown pour en extraire les données structurées avec correction des codes
 */
function processMarkdownTableWithCorrection(markdownText) {
    console.log("Traitement du tableau Markdown avec correction...");
    
    // Vérifier si le texte est vide
    if (!markdownText || markdownText.trim() === '') {
        console.log("Texte Markdown vide");
        return null;
    }
    
    // Résultat final
    const result = {
        headers: [],
        rows: [],
        persons: []
    };
    
    // Vérifier si le texte contient un tableau Markdown
    if (!markdownText.includes('|')) {
        console.warn('Aucun tableau Markdown détecté');
        return result;
    }
    
    // Diviser le texte en lignes
    const lines = markdownText.split('\n').filter(line => line.trim() !== '');
    
    // Filtrer les lignes qui contiennent des délimiteurs de tableau
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length < 1) {
        console.warn('Tableau Markdown incomplet');
        return result;
    }
    
    // Ignorer les lignes de séparation (---) et les lignes vides
    const dataLines = tableLines.filter(line => !line.includes('---') && line.trim() !== '');
    
    // Traiter chaque ligne du tableau
    let currentPerson = null;
    
    dataLines.forEach((line, index) => {
        // Diviser la ligne en cellules
        const cells = line.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell !== '');
        
        if (cells.length === 0) return;
        
        // Corriger les codes dans les cellules
        const correctedCells = cells.map((cell, cellIndex) => {
            // Ne pas corriger la première cellule (nom de la personne) ou les cellules trop longues
            if (cellIndex === 0 || cell.length > 10) {
                return cell;
            }
            
            // Corriger les codes
            return correctCode(cell);
        });
        
        if (index === 0) {
            // Première ligne = en-têtes
            result.headers = correctedCells;
        } else {
            // Vérifier si c'est une ligne principale (avec un nom) ou une ligne secondaire
            const firstCell = correctedCells[0];
            
            // Si c'est une ligne avec un nom de personne (pas un code)
            if (firstCell && !isLikelyCode(firstCell)) {
                // Nouvelle personne
                currentPerson = {
                    name: firstCell,
                    codes: []
                };
                
                // Extraire les codes
                for (let i = 1; i < correctedCells.length; i++) {
                    const code = correctedCells[i].trim();
                    if (code && code !== '') {
                        currentPerson.codes.push({
                            code: code,
                            day: i
                        });
                    }
                }
                
                // Ajouter la personne à la liste
                result.persons.push(currentPerson);
                
                // Ajouter la ligne au tableau
                result.rows.push(correctedCells);
            } else {
                // Ligne secondaire, l'ajouter au tableau
                result.rows.push(correctedCells);
            }
        }
    });
    
    return result;
}

/**
 * Vérifie si une chaîne ressemble à un code
 */
function isLikelyCode(str) {
    // Vérifier si c'est un code connu
    if (VALID_CODES.includes(str)) {
        return true;
    }
    
    // Vérifier si c'est un pourcentage
    if (str.includes('%')) {
        return true;
    }
    
    // Vérifier si c'est un code court (moins de 5 caractères)
    if (str.length <= 5) {
        return true;
    }
    
    return false;
}

/**
 * Corrige un code en fonction des codes valides
 */
function correctCode(code) {
    // Si le code est déjà valide, le retourner tel quel
    if (VALID_CODES.includes(code)) {
        return code;
    }
    
    // Corrections spécifiques connues
    if (code === 'RHE') return 'RH';
    
    // Rechercher le code valide le plus proche
    let bestMatch = '';
    let bestScore = 0;
    
    for (const validCode of VALID_CODES) {
        const score = similarityScore(code, validCode);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = validCode;
        }
    }
    
    // Si le score est suffisamment élevé, retourner le code corrigé
    if (bestScore > 0.5) {
        console.log(`Correction de code: "${code}" -> "${bestMatch}" (score: ${bestScore})`);
        return bestMatch;
    }
    
    // Sinon, retourner le code original
    return code;
}

/**
 * Calcule un score de similarité entre deux chaînes
 */
function similarityScore(str1, str2) {
    // Convertir en minuscules pour une comparaison insensible à la casse
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Si les chaînes sont identiques, retourner 1
    if (s1 === s2) return 1;
    
    // Calculer la distance de Levenshtein
    const m = s1.length;
    const n = s2.length;
    
    // Matrice pour la programmation dynamique
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialiser la première colonne et la première ligne
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    
    // Remplir la matrice
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // suppression
                d[i][j - 1] + 1,      // insertion
                d[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    // Calculer le score de similarité
    const maxLength = Math.max(m, n);
    return 1 - d[m][n] / maxLength;
}

/**
 * Traite le texte OCR pour une personne spécifique
 * 
 * @param {string} ocrText - Texte OCR brut
 * @param {string} personName - Nom de la personne à rechercher
 * @returns {Object} - Résultat du traitement
 */
function processOcrTextForPerson(ocrText, personName) {
    console.log(`Traitement du texte OCR pour la personne: ${personName}`);
    
    // Si aucun texte n'est fourni, retourner un résultat vide
    if (!ocrText) {
        console.log('Aucun texte OCR fourni');
        return { 
            success: true, 
            ocrText: '', 
            personName: personName,
            days: [],
            codes: []
        };
    }
    
    // Normaliser le nom pour la recherche
    const searchName = personName.trim().toUpperCase();
    console.log(`Nom normalisé pour la recherche: ${searchName}`);
    
    // Diviser le texte en lignes
    const lines = ocrText.split('\n');
    console.log(`Texte OCR divisé en ${lines.length} lignes`);
    
    // Afficher toutes les lignes pour le débogage
    console.log("Toutes les lignes du texte OCR:");
    lines.forEach((line, index) => {
        console.log(`Ligne ${index + 1}: ${line}`);
    });
    
    // Rechercher les lignes qui contiennent le nom de la personne
    const matchingLines = lines.filter(line => 
        line.toUpperCase().includes(searchName)
    );
    
    if (matchingLines.length === 0) {
        console.log(`Aucune ligne trouvée pour la personne: ${personName}`);
        
        // Vérifier si le texte est au format tableau Markdown
        if (ocrText.includes('|')) {
            console.log("Format tableau Markdown détecté, traitement spécial...");
            
            // Extraire les cellules du tableau
            const cells = [];
            lines.forEach(line => {
                if (line.includes('|')) {
                    const rowCells = line.split('|')
                        .map(cell => cell.trim())
                        .filter(cell => cell !== '');
                    cells.push(...rowCells);
                }
            });
            
            // Rechercher des cellules qui contiennent le nom de la personne
            const matchingCells = cells.filter(cell => 
                cell.toUpperCase().includes(searchName)
            );
            
            if (matchingCells.length > 0) {
                console.log(`Cellules trouvées pour la personne: ${matchingCells.length}`);
                matchingLines.push(...matchingCells);
            }
        }
    }
    
    // Si aucune ligne ne correspond, retourner un résultat vide
    if (matchingLines.length === 0) {
        console.log("Aucun code trouvé, analyse manuelle du texte OCR...");
        
        // Extraire tous les codes du texte OCR
        const allCodes = [];
        const codeRegex = /\b([A-Z][0-9][A-Z]|[A-Z][0-9][0-9]|[A-Z][A-Z][A-Z]|[A-Z][A-Z][0-9]|RH|[0-9]{2,3}%)\b/g;
        
        lines.forEach(line => {
            const matches = line.match(codeRegex);
            if (matches) {
                allCodes.push(...matches);
            }
        });
        
        // Éliminer les doublons
        const uniqueCodes = [...new Set(allCodes)];
        console.log(`${uniqueCodes.length} codes extraits au total`);
        
        return {
            success: true,
            ocrText: ocrText,
            personName: personName,
            days: Array.from({ length: 31 }, (_, i) => i + 1),
            codes: uniqueCodes
        };
    }
    
    // Analyser les lignes correspondantes
    let allCodes = [];
    
    matchingLines.forEach(line => {
        console.log(`Analyse de la ligne: ${line}`);
        
        // Extraire les codes de la ligne
        const codeRegex = /\b([A-Z][0-9][A-Z]|[A-Z][0-9][0-9]|[A-Z][A-Z][A-Z]|[A-Z][A-Z][0-9]|RH|[0-9]{2,3}%)\b/g;
        const matches = line.match(codeRegex);
        
        if (matches) {
            console.log(`${matches.length} codes trouvés:`, matches);
            allCodes.push(...matches);
        } else {
            console.log("Aucun code trouvé dans cette ligne");
        }
    });
    
    // Éliminer les doublons
    const uniqueCodes = [...new Set(allCodes)];
    
    // Corriger les codes
    const correctedCodes = uniqueCodes.map(code => correctCode(code));
    
    return {
        success: true,
        ocrText: ocrText,
        personName: personName,
        days: Array.from({ length: 31 }, (_, i) => i + 1),
        codes: correctedCodes
    };
}

/**
 * Extrait les noms et codes à partir du texte OCR
 * @param {string} ocrText - Le texte brut extrait par l'OCR
 * @returns {Array} - Un tableau d'objets {nom, codes}
 */
function extractNamesAndCodesFromOCR(ocrText) {
    console.log("Extraction des noms et codes à partir du texte OCR");
    
    // Si aucun texte n'est fourni, retourner un tableau vide
    if (!ocrText || typeof ocrText !== 'string') {
        console.error("Aucun texte OCR valide fourni");
        return [];
    }
    
    // Vérifier si le texte est au format tableau Markdown (contient des |)
    const isMarkdownTable = ocrText.includes('|');
    
    let lines = [];
    if (isMarkdownTable) {
        console.log("Format tableau Markdown détecté, traitement spécial...");
        
        // Diviser le texte en lignes
        const rawLines = ocrText.split('\n').filter(line => line.trim() !== '');
        
        // Pour chaque ligne de tableau, extraire les cellules
        for (const rawLine of rawLines) {
            // Diviser la ligne en cellules (séparées par |)
            const cells = rawLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            console.log(`Cellules extraites: ${cells.length}`);
            
            // Ajouter chaque cellule comme une "ligne" pour l'analyse
            lines = lines.concat(cells);
        }
    } else {
        // Traitement normal pour le texte non tabulaire
        lines = ocrText.split('\n').filter(line => line.trim() !== '');
    }
    
    console.log(`Nombre d'éléments à analyser: ${lines.length}`);
    console.log("Éléments à analyser:", lines);
    
    const namesAndCodes = [];
    const codeRegex = /\b([A-Z][0-9][A-Z]|[A-Z][0-9][0-9]|[A-Z][A-Z][A-Z]|[A-Z][A-Z][0-9])\b/g;
    
    // Parcourir chaque élément pour trouver les noms et codes
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Ignorer les éléments trop courts ou qui ne contiennent pas de lettres
        if (line.length < 3 || !/[a-zA-Z]/.test(line)) {
            continue;
        }
        
        // Rechercher les motifs qui ressemblent à des noms (en majuscules)
        // Adapter le pattern pour capturer aussi les noms comme "CANTICLAIRE"
        const nameMatch = line.match(/([A-Z][A-Z\-]+(?:\s+[A-Z][a-zA-Zéèêëàâäôöûüç\-]+)?)/);
        
        if (nameMatch) {
            const name = nameMatch[1].trim();
            
            // Cas spécial pour certains codes connus
            if (name === "RH" || name === "300%" || name === "400%" || name === "50%" || name === "60%") {
                // Ces éléments sont probablement des codes, pas des noms
                continue;
            }
            
            // Rechercher les codes dans tous les éléments
            let codes = [];
            
            // Chercher dans tous les éléments pour les codes associés à ce nom
            for (const item of lines) {
                const itemCodes = item.match(codeRegex) || [];
                for (const code of itemCodes) {
                    if (!codes.includes(code)) {
                        codes.push(code);
                    }
                }
            }
            
            // Corriger les codes
            const correctedCodes = codes.map(code => correctCode(code));
            
            namesAndCodes.push({
                nom: name,
                codes: correctedCodes
            });
            
            console.log(`Nom trouvé: ${name}, Codes: ${correctedCodes.length > 0 ? correctedCodes.join(', ') : 'aucun'}`);
        }
    }
    
    console.log(`Total des noms extraits: ${namesAndCodes.length}`);
    return namesAndCodes;
}

/**
 * Traite un tableau Markdown avec correction des codes
 * @param {string} markdownText - Texte Markdown à traiter
 * @returns {Object} - Données structurées du tableau
 */
function processMarkdownTableWithCorrection(markdownText) {
    console.log("Traitement du tableau Markdown avec correction...");
    
    // Vérifier si le texte est vide
    if (!markdownText || markdownText.trim() === '') {
        console.log("Texte Markdown vide");
        return null;
    }
    
    // Résultat final
    const result = {
        headers: [],
        rows: [],
        persons: []
    };
    
    // Vérifier si le texte contient un tableau Markdown
    if (!markdownText.includes('|')) {
        console.warn('Aucun tableau Markdown détecté');
        return result;
    }
    
    // Diviser le texte en lignes
    const lines = markdownText.split('\n').filter(line => line.trim() !== '');
    
    // Filtrer les lignes qui contiennent des délimiteurs de tableau
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length < 1) {
        console.warn('Tableau Markdown incomplet');
        return result;
    }
    
    // Ignorer les lignes de séparation (---) et les lignes vides
    const dataLines = tableLines.filter(line => !line.includes('---') && line.trim() !== '');
    
    // Traiter chaque ligne du tableau
    let currentPerson = null;
    
    dataLines.forEach((line, index) => {
        // Diviser la ligne en cellules
        const cells = line.split('|')
            .map(cell => cell.trim())
            .filter(cell => cell !== '');
        
        if (cells.length === 0) return;
        
        // Corriger les codes dans les cellules
        const correctedCells = cells.map((cell, cellIndex) => {
            // Ne pas corriger la première cellule (nom de la personne) ou les cellules trop longues
            if (cellIndex === 0 || cell.length > 10) {
                return cell;
            }
            
            // Corriger les codes
            return correctCode(cell);
        });
        
        if (index === 0) {
            // Première ligne = en-têtes
            result.headers = correctedCells;
        } else {
            // Vérifier si c'est une ligne principale (avec un nom) ou une ligne secondaire
            const firstCell = correctedCells[0];
            
            // Si c'est une ligne avec un nom de personne (pas un code)
            if (firstCell && !isLikelyCode(firstCell)) {
                // Nouvelle personne
                currentPerson = {
                    name: firstCell,
                    codes: []
                };
                
                // Extraire les codes
                for (let i = 1; i < correctedCells.length; i++) {
                    const code = correctedCells[i].trim();
                    if (code && code !== '') {
                        currentPerson.codes.push({
                            code: code,
                            day: i
                        });
                    }
                }
                
                // Ajouter la personne à la liste
                result.persons.push(currentPerson);
                
                // Ajouter la ligne au tableau
                result.rows.push(correctedCells);
            } else {
                // Ligne secondaire, l'ajouter au tableau
                result.rows.push(correctedCells);
            }
        }
    });
    
    return result;
}

/**
 * Vérifie si une chaîne ressemble à un code
 */
function isLikelyCode(str) {
    // Vérifier si c'est un code connu
    if (VALID_CODES.includes(str)) {
        return true;
    }
    
    // Vérifier si c'est un pourcentage
    if (str.includes('%')) {
        return true;
    }
    
    // Vérifier si c'est un code court (moins de 5 caractères)
    if (str.length <= 5) {
        return true;
    }
    
    return false;
}

/**
 * Corrige un code en fonction des codes valides
 */
function correctCode(code) {
    // Si le code est déjà valide, le retourner tel quel
    if (VALID_CODES.includes(code)) {
        return code;
    }
    
    // Corrections spécifiques connues
    if (code === 'RHE') return 'RH';
    
    // Rechercher le code valide le plus proche
    let bestMatch = '';
    let bestScore = 0;
    
    for (const validCode of VALID_CODES) {
        const score = similarityScore(code, validCode);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = validCode;
        }
    }
    
    // Si le score est suffisamment élevé, retourner le code corrigé
    if (bestScore > 0.5) {
        console.log(`Correction de code: "${code}" -> "${bestMatch}" (score: ${bestScore})`);
        return bestMatch;
    }
    
    // Sinon, retourner le code original
    return code;
}

/**
 * Calcule un score de similarité entre deux chaînes
 */
function similarityScore(str1, str2) {
    // Convertir en minuscules pour une comparaison insensible à la casse
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Si les chaînes sont identiques, retourner 1
    if (s1 === s2) return 1;
    
    // Calculer la distance de Levenshtein
    const m = s1.length;
    const n = s2.length;
    
    // Matrice pour la programmation dynamique
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialiser la première colonne et la première ligne
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    
    // Remplir la matrice
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,      // suppression
                d[i][j - 1] + 1,      // insertion
                d[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    // Calculer le score de similarité
    const maxLength = Math.max(m, n);
    return 1 - d[m][n] / maxLength;
}

/**
 * Redimensionne une image si elle est trop grande pour l'API Mistral OCR
 * 
 * @param {File} imageFile - Fichier image à redimensionner
 * @returns {Promise<Blob>} - Promesse résolue avec l'image redimensionnée
 */
async function resizeImageIfNeeded(imageFile) {
    console.log(`Préparation de l'image pour l'OCR: ${imageFile.name}, type: ${imageFile.type}, taille: ${Math.round(imageFile.size / 1024)} KB`);
    
    // Créer un objet URL pour l'image
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Créer une image pour obtenir les dimensions
    const img = new Image();
    
    // Attendre que l'image soit chargée
    await new Promise(resolve => {
        img.onload = resolve;
        img.src = imageUrl;
    });
    
    // Récupérer les dimensions de l'image
    const originalWidth = img.width;
    const originalHeight = img.height;
    console.log(`Dimensions originales de l'image: ${originalWidth}x${originalHeight}`);
    
    // Vérifier si l'image a besoin d'être redimensionnée
    // Mistral OCR fonctionne mieux avec des images de taille modérée
    const MAX_WIDTH = 2000;
    const MAX_HEIGHT = 2000;
    const MAX_SIZE_KB = 1000; // 1 MB
    
    let needsResize = originalWidth > MAX_WIDTH || 
                      originalHeight > MAX_HEIGHT || 
                      imageFile.size > MAX_SIZE_KB * 1024;
    
    // Si l'image n'a pas besoin d'être redimensionnée, la retourner telle quelle
    if (!needsResize) {
        console.log(`L'image est déjà optimisée pour l'OCR`);
        URL.revokeObjectURL(imageUrl);
        return imageFile;
    }
    
    // Calculer les nouvelles dimensions en conservant le ratio
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    if (originalWidth > MAX_WIDTH) {
        newWidth = MAX_WIDTH;
        newHeight = Math.floor(originalHeight * (MAX_WIDTH / originalWidth));
    }
    
    if (newHeight > MAX_HEIGHT) {
        newHeight = MAX_HEIGHT;
        newWidth = Math.floor(newWidth * (MAX_HEIGHT / newHeight));
    }
    
    console.log(`Redimensionnement de l'image: ${originalWidth}x${originalHeight} -> ${newWidth}x${newHeight}`);
    
    // Créer un canvas pour le redimensionnement
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Dessiner l'image redimensionnée sur le canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Optimiser la qualité et le format
    let mimeType = 'image/jpeg';
    let quality = 0.9;
    
    // Convertir l'image en JPEG pour réduire la taille
    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, mimeType, quality);
    });
    
    // Vérifier la taille après redimensionnement
    console.log(`Image convertie en JPEG: ${Math.round(blob.size / 1024)} KB`);
    
    // Libérer l'URL de l'image
    URL.revokeObjectURL(imageUrl);
    
    // Créer un nouveau fichier avec le même nom mais au format JPEG
    const newFileName = imageFile.name.replace(/\.[^/.]+$/, '') + '.jpg';
    const newFile = new File([blob], newFileName, { type: mimeType });
    
    console.log(`Image prête pour l'OCR: ${newFile.name}, type: ${newFile.type}, taille: ${Math.round(newFile.size / 1024)} KB`);
    
    return newFile;
}

/**
 * Convertit un fichier en chaîne base64
 * 
 * @param {File} file - Fichier à convertir
 * @returns {Promise<string>} - Chaîne base64
 */
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Extraire la partie base64 de la chaîne data URL
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => {
            console.error('Erreur lors de la lecture du fichier:', error);
            reject(error);
        };
    });
}

/**
 * Simule une analyse OCR pour le mode démo
 * 
 * @param {string} personName - Nom de la personne
 * @returns {Object} - Résultats simulés
 */
function simulateOCRAnalysis(personName) {
    console.log("Mode démo activé - Simulation de l'analyse OCR");
    
    // Résultats simulés
    const demoResults = {
        "DECOLLE AURORE": {
            "1": "JBD",
            "2": "JB1",
            "3": "M/M",
            "4": "JBD",
            "5": "JBD",
            "6": "C/B",
            "7": "JB1",
            "8": "JB1",
            "9": "JBC",
            "10": "JBC",
            "11": "M/B",
            "12": "M/M",
            "13": "C/B",
            "14": "JBC",
            "15": "JB1",
            "16": "JB1",
            "17": "JBD",
            "18": "M/M",
            "19": "JBD",
            "20": "C/B",
            "21": "JBC",
            "22": "JB1",
            "23": "JB1",
            "24": "JBC",
            "25": "JBC",
            "26": "JPX",
            "27": "C/B",
            "28": "JB1",
            "29": "JNC",
            "30": "JNC",
            "31": "JB1"
        },
        "BECKER LEA": {
            "1": "JB1",
            "2": "JB1",
            "3": "JPX",
            "4": "JNC",
            "5": "JBC",
            "6": "JB1",
            "7": "JB1",
            "8": "JNC",
            "9": "JPX",
            "10": "JBC",
            "11": "JBC",
            "12": "JBD",
            "13": "JPX",
            "14": "JPX",
            "15": "JB1",
            "16": "JB1",
            "17": "JPX",
            "18": "JNC",
            "19": "JNC",
            "20": "JB1",
            "21": "JB1",
            "22": "JNC",
            "23": "JNC",
            "24": "JBC",
            "25": "JBC",
            "26": "JBC",
            "27": "JBC",
            "28": "JPX",
            "29": "JB1",
            "30": "JB1",
            "31": "JPX"
        }
    };
    
    // Chercher un résultat correspondant au nom de la personne
    for (const name in demoResults) {
        if (name.toLowerCase().includes(personName.toLowerCase()) || 
            personName.toLowerCase().includes(name.toLowerCase())) {
            console.log(`Résultat démo trouvé pour ${name}`);
            return {
                personName: name,
                days: demoResults[name]
            };
        }
    }
    
    // Si aucun résultat correspondant n'est trouvé, générer des données aléatoires
    console.log("Aucun résultat démo trouvé, génération de données aléatoires");
    const codes = ["JBD", "JB1", "M/M", "C/B", "JBC", "JPX", "JNC"];
    const randomResults = {};
    
    for (let i = 1; i <= 31; i++) {
        if (Math.random() > 0.2) { // 80% de chance d'avoir un code
            const randomCode = codes[Math.floor(Math.random() * codes.length)];
            randomResults[i.toString()] = randomCode;
        }
    }
    
    return {
        personName: personName,
        days: randomResults
    };
}

/**
 * Crée un prompt simplifié pour l'API Mistral OCR
 * 
 * @param {string} personName - Nom de la personne à rechercher
 * @returns {string} - Prompt pour l'API
 */
function createSimpleOCRPrompt(personName) {
    return `
Analyse cette image d'un tableau de planning mensuel.
Trouve la ligne correspondant à "${personName.toUpperCase()}" dans la première colonne.
Pour cette ligne, identifie les codes (séquences de 2-4 caractères) présents dans chaque cellule.
Associe chaque code au numéro du jour correspondant (1-31).

Retourne un objet JSON avec cette structure:
{
  "personName": "nom de la personne trouvée",
  "days": {
    "1": "code du jour 1",
    "2": "code du jour 2",
    ...
  }
}
`;
}

/**
 * Extrait manuellement les résultats à partir du texte OCR si le parsing JSON échoue
 * 
 * @param {string} ocrText - Texte OCR brut
 * @param {string} personName - Nom de la personne recherchée
 * @returns {Object} - Résultats structurés
 */
function extractResultsManually(ocrText, personName) {
    // Résultat par défaut
    const result = {
        personName: personName,
        days: {}
    };
    
    // Rechercher des patterns comme "jour X: CODE" ou "X: CODE"
    const dayCodePattern = /(?:jour|day)\s*(\d{1,2})\s*[:=-]\s*([A-Z0-9\/]{2,4})/gi;
    let match;
    
    while ((match = dayCodePattern.exec(ocrText)) !== null) {
        const day = match[1].trim();
        const code = match[2].trim();
        
        if (day && code) {
            result.days[day] = code;
            console.log(`Code trouvé pour le jour ${day}: ${code}`);
        }
    }
    
    // Si aucun résultat n'a été trouvé, essayer d'autres patterns
    if (Object.keys(result.days).length === 0) {
        // Chercher des lignes qui contiennent des codes
        const lines = ocrText.split('\n');
        
        for (const line of lines) {
            // Ignorer les lignes trop courtes
            if (line.length < 5) continue;
            
            // Chercher une ligne qui contient le nom de la personne
            if (line.toLowerCase().includes(personName.toLowerCase())) {
                // Extraire les codes potentiels (séquences de 2-4 caractères alphanumériques)
                const codeMatches = line.match(/[A-Z0-9\/]{2,4}/g);
                
                if (codeMatches && codeMatches.length > 0) {
                    // Associer les codes aux jours (en supposant qu'ils sont dans l'ordre)
                    codeMatches.forEach((code, index) => {
                        // Commencer à partir du jour 1
                        const day = index + 1;
                        if (day <= 31) {
                            result.days[day.toString()] = code;
                        }
                    });
                }
                
                break;
            }
        }
    }
    
    return result;
}

/**
 * Extrait les noms de personnes du texte OCR
 * 
 * @param {string} ocrText - Texte OCR brut
 * @returns {Array} - Liste des noms de personnes trouvés
 */
function extractPersonNamesFromOCR(ocrText) {
    console.log("Extraction des noms de personnes du texte OCR");
    
    // Si aucun texte n'est fourni, retourner un tableau vide
    if (!ocrText || typeof ocrText !== 'string') {
        console.error("Aucun texte OCR valide fourni");
        return [];
    }
    
    // Vérifier si le texte est au format tableau Markdown (contient des |)
    const isMarkdownTable = ocrText.includes('|');
    
    let elements = [];
    if (isMarkdownTable) {
        console.log("Format tableau Markdown détecté, traitement spécial...");
        
        // Diviser le texte en lignes
        const rawLines = ocrText.split('\n').filter(line => line.trim() !== '');
        
        // Pour chaque ligne de tableau, extraire les cellules
        for (const rawLine of rawLines) {
            // Diviser la ligne en cellules (séparées par |)
            const cells = rawLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            
            // Ajouter chaque cellule comme un "élément" pour l'analyse
            elements = elements.concat(cells);
        }
    } else {
        // Traitement normal pour le texte non tabulaire
        elements = ocrText.split('\n').filter(line => line.trim() !== '');
    }
    
    console.log(`Texte OCR divisé en ${elements.length} éléments pour extraction des noms`);
    
    // Stocker les noms trouvés
    const names = [];
    
    // Parcourir chaque élément pour trouver les noms
    for (const element of elements) {
        // Ignorer les éléments trop courts ou qui ne contiennent pas de lettres
        if (element.length < 3 || !/[a-zA-Z]/.test(element)) {
            continue;
        }
        
        // Rechercher les motifs qui ressemblent à des noms (en majuscules)
        // Adapter le pattern pour capturer aussi les noms comme "CANTICLAIRE"
        const nameMatch = element.match(/([A-Z][A-Z\-]+(?:\s+[A-Z][a-zA-Zéèêëàâäôöûüç\-]+)?)/);
        
        if (nameMatch) {
            const name = nameMatch[1].trim();
            
            // Cas spécial pour certains codes connus
            if (name === "RH" || name === "300%" || name === "400%" || name === "50%" || name === "60%") {
                // Ces éléments sont probablement des codes, pas des noms
                continue;
            }
            
            // Ajouter le nom s'il n'est pas déjà présent
            if (!names.includes(name)) {
                names.push(name);
            }
        }
    }
    
    console.log(`${names.length} noms uniques trouvés:`, names);
    return names;
}

/**
 * Génère une réponse de démo pour le mode démo
 * 
 * @param {string} personName - Nom de la personne
 * @returns {Object} - Résultats de démo
 */
function generateDemoResponse(personName) {
    console.log("Mode démo activé - Génération de résultats de démo");
    
    // Résultats de démo
    const demoResults = {
        personName: personName,
        days: {}
    };
    
    // Générer des données aléatoires pour les jours
    const codes = ["JBD", "JB1", "M/M", "C/B", "JBC", "JPX", "JNC"];
    for (let i = 1; i <= 31; i++) {
        if (Math.random() > 0.2) { // 80% de chance d'avoir un code
            const randomCode = codes[Math.floor(Math.random() * codes.length)];
            demoResults.days[i.toString()] = randomCode;
        }
    }
    
    return demoResults;
}

/**
 * Calcule un score de similarité entre un nom et une ligne de texte
 * 
 * @param {string} name - Nom à rechercher
 * @param {string} line - Ligne de texte
 * @returns {number} - Score de similarité (0-1)
 */
function calculateSimilarityScore(name, line) {
    // Diviser la ligne en mots
    const words = line.split(/\s+/);
    
    // Pour chaque mot, calculer la similarité avec le nom
    let maxScore = 0;
    
    for (const word of words) {
        if (word.length < 3) continue; // Ignorer les mots trop courts
        
        // Calculer la similarité entre le nom et le mot
        const score = calculateStringSimilarity(name, word);
        maxScore = Math.max(maxScore, score);
    }
    
    return maxScore;
}

/**
 * Calcule la similarité entre deux chaînes (0-1)
 * 
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} - Score de similarité (0-1)
 */
function calculateStringSimilarity(str1, str2) {
    // Pour les chaînes très courtes, utiliser une méthode simple
    if (str1.length <= 3 || str2.length <= 3) {
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
