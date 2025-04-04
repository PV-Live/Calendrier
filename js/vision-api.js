/**
 * Configuration de l'API Google Vision
 */
const VISION_API_CONFIG = {
    endpoint: 'https://vision.googleapis.com/v1/images:annotate',
    apiKey: null
};

/**
 * Analyse une image avec l'API Google Vision et retourne le texte brut
 * 
 * @param {File} imageFile - Fichier image à analyser
 * @param {string} apiKey - Clé API Google Vision
 * @returns {Promise<Object>} - Résultat brut de l'analyse OCR
 */
async function analyzeImageWithGoogleVision(imageFile, apiKey) {
    console.log('=== DÉBUT ANALYSE GOOGLE VISION ===');
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
        
        // Convertir l'image en base64
        const base64Image = await convertImageToBase64(imageFile);
        console.log(`Image convertie en base64 (longueur: ${base64Image.length} caractères)`);
        
        // Préparer les données de la requête pour Google Vision
        const requestData = {
            requests: [
                {
                    image: {
                        content: base64Image
                    },
                    features: [
                        {
                            type: "DOCUMENT_TEXT_DETECTION"
                        }
                    ]
                }
            ]
        };
        
        // Envoyer la requête à l'API
        console.log('Envoi de la requête à l\'API Google Vision...');
        const response = await fetch(`${VISION_API_CONFIG.endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        
        // Extraire le texte OCR
        let ocrText = '';
        
        if (data.responses && data.responses.length > 0) {
            const response = data.responses[0];
            
            // Essayer d'extraire le texte complet
            if (response.fullTextAnnotation && response.fullTextAnnotation.text) {
                ocrText = response.fullTextAnnotation.text;
            } 
            // Si pas de texte complet, essayer d'extraire à partir des annotations
            else if (response.textAnnotations && response.textAnnotations.length > 0) {
                ocrText = response.textAnnotations[0].description;
            }
        }
        
        console.log('Texte OCR extrait:', ocrText);
        console.log('=== FIN ANALYSE GOOGLE VISION (SUCCÈS) ===');
        
        return {
            success: true,
            ocrText: ocrText,
            rawResponse: data
        };
    } catch (error) {
        console.error('Erreur lors de l\'analyse OCR:', error);
        console.log('=== FIN ANALYSE GOOGLE VISION (AVEC ERREUR) ===');
        
        return {
            success: false,
            error: error.message,
            rawResponse: null
        };
    }
}

/**
 * Convertit une image en base64
 * 
 * @param {File} imageFile - Fichier image à convertir
 * @returns {Promise<string>} - Image encodée en base64
 */
async function convertImageToBase64(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            // Extraire la partie base64 de l'URL de données
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        
        reader.onerror = error => {
            reject(error);
        };
        
        reader.readAsDataURL(imageFile);
    });
}

// Exposer les fonctions au niveau global
window.analyzeImageWithGoogleVision = analyzeImageWithGoogleVision;
window.convertImageToBase64 = convertImageToBase64;
