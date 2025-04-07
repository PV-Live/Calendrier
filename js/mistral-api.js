/**
 * Configuration de l'API Mistral OCR
 */
const MISTRAL_API_CONFIG = {
    endpoint: 'https://api.mistral.ai/v1/ocr',
    apiKey: null
};

/**
 * Analyse une image avec l'API Mistral OCR et retourne le texte brut
 * 
 * @param {File} imageFile - Fichier image à analyser
 * @param {string} apiKey - Clé API Mistral
 * @returns {Promise<Object>} - Résultat brut de l'analyse OCR
 */
async function analyzeImageWithMistralOCR(imageFile, apiKey) {
    appLogger.log('=== DÉBUT ANALYSE MISTRAL OCR ===');
    appLogger.log(`Type de fichier: ${imageFile.type}, Taille: ${Math.round(imageFile.size / 1024)} KB`);
    
    // Envoyer un événement de début d'analyse
    sendAnalyticsEvent('image_analysis_started', {
        image_size: imageFile.size,
        image_type: imageFile.type
    });
    
    try {
        // Vérifier si la clé API est fournie
        if (!apiKey) {
            appLogger.warn('Aucune clé API fournie, utilisation du mode démo');
            // Envoyer un événement d'erreur
            sendAnalyticsEvent('image_analysis_error', {
                error_type: 'no_api_key'
            });
            return {
                success: true,
                ocrText: "Mode démo - Texte OCR simulé",
                rawResponse: { demo: true }
            };
        }
        
        // Convertir l'image en base64
        const base64Image = await convertImageToBase64(imageFile);
        appLogger.log(`Image convertie en base64 (longueur: ${base64Image.length} caractères)`);
        
        // Préparer les données de la requête
        const requestData = {
            model: "mistral-ocr-latest",
            document: {
                type: "image_url",
                image_url: `data:${imageFile.type};base64,${base64Image}`
            }
        };
        
        // Envoyer la requête à l'API
        appLogger.log('Envoi de la requête à l\'API Mistral OCR...');
        const response = await fetch(MISTRAL_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestData)
        });
        
        // Vérifier si la requête a réussi
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            appLogger.error(`Erreur API (${response.status}):`, errorData);
            // Envoyer un événement d'erreur
            sendAnalyticsEvent('image_analysis_error', {
                error_type: 'api_error',
                status_code: response.status,
                error_message: errorData.error?.message || "Erreur inconnue"
            });
            throw new Error(`Erreur API: ${response.status} - ${errorData.error?.message || 'Erreur inconnue'}`);
        }
        
        // Récupérer la réponse
        const data = await response.json();
        appLogger.log('Réponse de l\'API reçue');
        appLogger.log('Réponse complète:', JSON.stringify(data, null, 2));
        
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
        
        appLogger.log('Texte OCR extrait:', ocrText);
        appLogger.log('=== FIN ANALYSE MISTRAL OCR (SUCCÈS) ===');
        
        // Envoyer un événement de succès
        sendAnalyticsEvent('image_analysis_success', {
            text_length: ocrText.length
        });
        
        return {
            success: true,
            ocrText: ocrText,
            rawResponse: data
        };
    } catch (error) {
        appLogger.error('Erreur lors de l\'analyse OCR:', error);
        appLogger.log('=== FIN ANALYSE MISTRAL OCR (AVEC ERREUR) ===');
        
        // Envoyer un événement d'erreur
        sendAnalyticsEvent('image_analysis_error', {
            error_type: 'exception',
            error_message: error.message
        });
        
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
function convertImageToBase64(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Extraire la partie base64 de l'URL de données
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(imageFile);
    });
}
