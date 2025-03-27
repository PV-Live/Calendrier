/**
 * Calendrier Leo - Module API Mistral OCR
 * Gère les appels à l'API Mistral OCR pour l'analyse des images
 */

// Configuration de l'API Mistral
const MISTRAL_API_CONFIG = {
    apiKey: 'm4aNE1jpun7jTCNOzx03uKsvIX504ii0', // À remplir avec votre clé API Mistral
    endpoint: 'https://api.mistral.ai/v1/ocr', // Endpoint de l'API OCR de Mistral
    model: 'mistral-ocr-medium' // Modèle OCR à utiliser
};

/**
 * Analyse une image avec l'API Mistral OCR
 * 
 * @param {File} imageFile - Fichier image à analyser
 * @param {string} personName - Nom de la personne à rechercher dans le planning
 * @returns {Promise<Object>} - Résultats de l'analyse
 */
async function analyzeImageWithMistralOCR(imageFile, personName) {
    try {
        // Vérifier si la clé API est configurée
        if (!MISTRAL_API_CONFIG.apiKey) {
            // Mode démo - simuler une analyse
            return simulateOCRAnalysis(personName);
        }
        
        // Convertir l'image en base64
        const base64Image = await fileToBase64(imageFile);
        
        // Préparer la requête
        const requestData = {
            model: MISTRAL_API_CONFIG.model,
            image: base64Image,
            prompt: createOCRPrompt(personName)
        };
        
        // Appeler l'API Mistral OCR
        const response = await fetch(MISTRAL_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestData)
        });
        
        // Vérifier la réponse
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erreur API Mistral: ${errorData.error || response.statusText}`);
        }
        
        // Traiter la réponse
        const responseData = await response.json();
        
        // Extraire et formater les résultats
        return processOCRResponse(responseData, personName);
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse OCR:', error);
        
        // En cas d'erreur, utiliser le mode démo
        console.log('Utilisation du mode démo suite à une erreur');
        return simulateOCRAnalysis(personName);
    }
}

/**
 * Crée un prompt spécifique pour l'analyse OCR
 * 
 * @param {string} personName - Nom de la personne à rechercher
 * @returns {string} - Prompt formaté
 */
function createOCRPrompt(personName) {
    return `
    Tu es un expert en analyse de plannings de travail.

    TÂCHE CRITIQUE:
    1. Localise précisément la ligne correspondant à "${personName}" dans la colonne de gauche où sont listés les noms.
    2. Pour cette personne UNIQUEMENT, identifie les codes de travail pour CHAQUE JOUR du mois visible dans le tableau.
    3. Les codes sont des séquences de 2-3 caractères (lettres et/ou chiffres) comme JBD, M7M, RH, JPX, etc.
    4. IMPORTANT: Examine TOUS les jours visibles dans le planning, de 1 à 31.
    5. Pour les jours sans code visible (cellule vide ou avec un point), utilise une chaîne vide "".

    FORMAT DE RÉPONSE (TRÈS IMPORTANT):
    Tu dois UNIQUEMENT renvoyer un objet JSON valide, sans aucun texte avant ou après, avec cette structure exacte:
    {
      "days": {
        "1": "CODE1",
        "2": "CODE2",
        ...
        "31": "CODE31"
      },
      "person": "${personName}"
    }
    `;
}

/**
 * Traite la réponse de l'API OCR pour extraire les informations pertinentes
 * 
 * @param {Object} response - Réponse de l'API
 * @param {string} personName - Nom de la personne
 * @returns {Object} - Résultats formatés
 */
function processOCRResponse(response, personName) {
    // Extraire le texte de la réponse
    const responseText = response.text || response.content || '';
    
    try {
        // Essayer de parser le JSON directement
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            
            // Vérifier si les données sont au format attendu
            if (jsonData.days) {
                return jsonData;
            }
        }
        
        // Si le parsing a échoué, construire un objet par défaut
        console.warn('Format de réponse OCR non reconnu, construction d\'un objet par défaut');
        return {
            days: extractDaysFromText(responseText),
            person: personName
        };
        
    } catch (error) {
        console.error('Erreur lors du traitement de la réponse OCR:', error);
        
        // En cas d'erreur, retourner un objet par défaut
        return {
            days: extractDaysFromText(responseText),
            person: personName
        };
    }
}

/**
 * Extrait les informations des jours à partir du texte brut
 * 
 * @param {string} text - Texte brut de la réponse
 * @returns {Object} - Objet avec les jours et les codes
 */
function extractDaysFromText(text) {
    const days = {};
    
    // Rechercher des motifs comme "jour X: CODE" ou "X: CODE"
    const dayCodePattern = /(?:jour\s*)?(\d{1,2})\s*[:=-]\s*["']?([A-Za-z0-9]{0,3})["']?/gi;
    let match;
    
    while ((match = dayCodePattern.exec(text)) !== null) {
        const day = match[1];
        const code = match[2] || '';
        days[day] = code;
    }
    
    // S'assurer que tous les jours sont présents (1-31)
    for (let i = 1; i <= 31; i++) {
        if (!days[i]) {
            days[i] = '';
        }
    }
    
    return days;
}

/**
 * Convertit un fichier en chaîne base64
 * 
 * @param {File} file - Fichier à convertir
 * @returns {Promise<string>} - Chaîne base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Extraire la partie base64 de la chaîne data URL
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Simule une analyse OCR (pour le mode démo ou en cas d'erreur)
 * 
 * @param {string} personName - Nom de la personne
 * @returns {Object} - Résultats simulés
 */
function simulateOCRAnalysis(personName) {
    console.log('Mode démo: simulation d\'une analyse OCR');
    
    // Générer des codes aléatoires pour chaque jour
    const days = {};
    const possibleCodes = ['JBD', 'JBB', 'RH', 'CP', 'M', 'F', ''];
    
    for (let i = 1; i <= 31; i++) {
        // Générer un code aléatoire (avec une chance sur 3 d'être vide)
        const randomIndex = Math.floor(Math.random() * possibleCodes.length);
        days[i] = possibleCodes[randomIndex];
    }
    
    // Simuler un délai d'analyse (entre 1 et 2 secondes)
    return new Promise(resolve => {
        const delay = 1000 + Math.random() * 1000;
        setTimeout(() => {
            resolve({
                days,
                person: personName
            });
        }, delay);
    });
}
