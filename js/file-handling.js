/**
 * file-handling.js
 * Gestion des fichiers et du glisser-déposer pour l'application Calendrier CHAL
 */

/**
 * Empêche les comportements par défaut des événements
 * @param {Event} e - L'événement
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Met en surbrillance la zone de dépôt
 * @param {Event} e - L'événement
 */
function highlight(e) {
    preventDefaults(e);
    elements.dropArea.classList.add('highlight');
}

/**
 * Retire la surbrillance de la zone de dépôt
 * @param {Event} e - L'événement
 */
function unhighlight(e) {
    preventDefaults(e);
    elements.dropArea.classList.remove('highlight');
}

/**
 * Gère l'événement de survol lors du glisser-déposer
 * @param {DragEvent} e - L'événement de survol
 */
function handleDragOver(e) {
    preventDefaults(e);
    highlight(e);
}

/**
 * Gère l'événement de dépôt lors du glisser-déposer
 * @param {DragEvent} e - L'événement de dépôt
 */
function handleDrop(e) {
    preventDefaults(e);
    unhighlight(e);
    
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFiles(files);
    }
}

/**
 * Gère les fichiers déposés ou sélectionnés
 * @param {FileList} files - Liste des fichiers
 */
function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        
        // Vérifier si le fichier est une image
        if (!file.type.match('image.*')) {
            showToast('Veuillez sélectionner une image', 'error');
            return;
        }
        
        // Mettre à jour l'état de l'application
        appState.imageFile = file;
        
        // Afficher l'aperçu de l'image
        const reader = new FileReader();
        reader.onload = function(e) {
            if (elements.filePreview) {
                elements.filePreview.src = e.target.result;
            }
            
            if (elements.previewContainer) {
                elements.previewContainer.hidden = false;
            }
            
            // Mettre à jour l'état du formulaire
            updateFormState();
        };
        
        reader.readAsDataURL(file);
        
        console.log(`Fichier chargé: ${file.name} (${file.type}, ${file.size} octets)`);
    }
}

/**
 * Gère l'événement de sélection de fichier via l'input file
 * @param {Event} e - L'événement de changement
 */
function handleFileSelect(e) {
    const files = e.target.files;
    
    if (files.length > 0) {
        handleFiles(files);
    }
}

/**
 * Supprime l'image sélectionnée
 */
function removeImage() {
    // Réinitialiser l'état de l'application
    appState.imageFile = null;
    
    // Réinitialiser l'input file
    if (elements.fileInput) {
        elements.fileInput.value = '';
    }
    
    // Masquer l'aperçu
    if (elements.previewContainer) {
        elements.previewContainer.hidden = true;
    }
    
    // Réinitialiser l'image d'aperçu
    if (elements.filePreview) {
        elements.filePreview.src = '';
    }
    
    // Mettre à jour l'état du formulaire
    updateFormState();
    
    console.log("Image supprimée");
}

// Exposer les fonctions au niveau global
window.preventDefaults = preventDefaults;
window.highlight = highlight;
window.unhighlight = unhighlight;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
window.handleFiles = handleFiles;
window.handleFileSelect = handleFileSelect;
window.removeImage = removeImage;
