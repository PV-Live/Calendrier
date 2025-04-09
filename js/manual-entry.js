/**
 * manual-entry.js
 * Fonctionnalités pour la saisie manuelle des codes pour l'application Calendrier CHAL
 */

/**
 * Ajoute un bouton pour permettre à l'utilisateur d'entrer manuellement les codes
 */
function addManualEntryButton() {
    appLogger.log("Ajout du bouton de saisie manuelle...");
    
    // Vérifier si le bouton existe déjà
    if (document.getElementById('manual-entry-button')) {
        return;
    }
    
    // Créer le bouton
    const manualEntryButton = document.createElement('button');
    manualEntryButton.id = 'manual-entry-button';
    manualEntryButton.className = 'button primary-button';
    manualEntryButton.textContent = 'Saisie manuelle des codes';
    
    // Ajouter le bouton à côté du bouton d'analyse
    if (elements.analyzeButton && elements.analyzeButton.parentNode) {
        elements.analyzeButton.parentNode.appendChild(manualEntryButton);
        
        // Ajouter l'écouteur d'événement
        manualEntryButton.addEventListener('click', showCalendarWithManualEntry);
    }
}

/**
 * Affiche le calendrier avec une zone de saisie manuelle
 */
function showCalendarWithManualEntry() {
    appLogger.log("Affichage du calendrier avec saisie manuelle");
    
    // Envoyer un événement d'ouverture de saisie manuelle
    sendAnalyticsEvent('manual_entry_opened');
    
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
    
    // Calculer le nombre de jours dans le mois
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Créer un résultat vide
    const result = {
        found: true,
        name: personName,
        codes: Array(daysInMonth).fill(''),
        rawText: 'Saisie manuelle',
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
    
    // Afficher la section des résultats
    if (elements.resultsSection) {
        elements.resultsSection.hidden = false;
    }
    
    // Masquer la table des résultats (on affiche seulement le calendrier)
    if (elements.resultsTableBody && elements.resultsTableBody.closest('.table-container')) {
        elements.resultsTableBody.closest('.table-container').style.display = 'none';
    }
    
    // Créer et afficher la zone de saisie manuelle
    createManualEntryArea();
}

/**
 * Crée et affiche la zone de saisie manuelle
 */
function createManualEntryArea() {
    appLogger.log("Création de la zone de saisie manuelle");
    
    // Vérifier si la zone existe déjà
    let manualEntryArea = document.getElementById('manual-entry-area');
    
    if (!manualEntryArea) {
        // Créer la zone de saisie
        manualEntryArea = document.createElement('div');
        manualEntryArea.id = 'manual-entry-area';
        manualEntryArea.className = 'manual-entry-area';
        
        // Créer les onglets
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'tabs-container';
        
        const simpleTab = document.createElement('div');
        simpleTab.className = 'tab active';
        simpleTab.textContent = 'Saisie simple';
        simpleTab.dataset.tab = 'simple';
        
        tabsContainer.appendChild(simpleTab);
        manualEntryArea.appendChild(tabsContainer);
        
        // Créer le contenu de l'onglet "Saisie simple"
        const simpleTabContent = document.createElement('div');
        simpleTabContent.id = 'simple-tab-content';
        simpleTabContent.className = 'tab-content active';
        
        const simpleDescription = document.createElement('p');
        simpleDescription.textContent = 'Entrez les codes séparés par des virgules ou des espaces.';
        simpleTabContent.appendChild(simpleDescription);
        
        const simpleInput = document.createElement('textarea');
        simpleInput.id = 'manual-codes-input';
        simpleInput.placeholder = 'Exemple: JRD, RH, M7M, JRD, JRD, C9E, RH, RH, RH, RH, M7M, C9E, ...';
        simpleInput.rows = 5;
        simpleTabContent.appendChild(simpleInput);
        
        manualEntryArea.appendChild(simpleTabContent);
        
        // Créer les boutons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons-container';
        
        const submitButton = document.createElement('button');
        submitButton.className = 'button primary-button';
        submitButton.textContent = 'Appliquer les codes';
        submitButton.onclick = processManualCodes;
        buttonsContainer.appendChild(submitButton);
        
        manualEntryArea.appendChild(buttonsContainer);
        
        // Ajouter la zone de saisie avant le calendrier
        if (elements.calendarContainer && elements.calendarContainer.parentNode) {
            elements.calendarContainer.parentNode.insertBefore(manualEntryArea, elements.calendarContainer);
        } else if (elements.resultsContent) {
            // Fallback si le conteneur de calendrier n'est pas trouvé
            elements.resultsContent.insertBefore(manualEntryArea, elements.resultsContent.firstChild);
        } else {
            document.body.appendChild(manualEntryArea);
        }
        
        // Ajouter les styles CSS
        addManualEntryStyles();
    } else {
        // Réinitialiser les champs
        document.getElementById('manual-codes-input').value = '';
        
        // Afficher la zone
        manualEntryArea.style.display = 'block';
    }
}

/**
 * Change l'onglet actif
 * @param {string} tabId - ID de l'onglet à activer
 */
function switchTab(tabId) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Désactiver tous les contenus d'onglets
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    
    // Activer le contenu de l'onglet sélectionné
    if (tabId === 'simple') {
        document.getElementById('simple-tab-content').classList.add('active');
    }
}

/**
 * Ajoute les styles CSS pour la zone de saisie manuelle
 */
function addManualEntryStyles() {
    // Vérifier si les styles existent déjà
    if (document.getElementById('manual-entry-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'manual-entry-styles';
    style.textContent = `
        .manual-entry-area {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
        }
        
        .tabs-container {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 15px;
        }
        
        .tab {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .tab.active {
            border-bottom: 2px solid #4285f4;
            color: #4285f4;
            font-weight: bold;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .buttons-container {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
        }
        
        .manual-entry-area textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            margin-bottom: 10px;
        }
        
        .manual-entry-area textarea:focus {
            outline: none;
            border-color: #4285f4;
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Traite les codes entrés manuellement par l'utilisateur
 */
function processManualCodes() {
    appLogger.log("Traitement des codes manuels");
    
    // Envoyer un événement de début de traitement manuel
    sendAnalyticsEvent('manual_entry_processing_started');
    
    // Vérifier si un résultat existe
    if (!appState.results) {
        showToast("Erreur: aucun résultat à mettre à jour", "error");
        return;
    }
    
    // Calculer le nombre de jours dans le mois
    const month = appState.results.month;
    const year = appState.results.year;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Déterminer quel onglet est actif
    const isSimpleTab = document.querySelector('.tab[data-tab="simple"]').classList.contains('active');
    
    let codes = [];
    
    if (isSimpleTab) {
        // Traitement de l'onglet "Saisie simple"
        const input = document.getElementById('manual-codes-input');
        
        if (!input || !input.value.trim()) {
            showToast('Veuillez entrer des codes', 'error');
            return;
        }
        
        // Traiter les codes
        const codesText = input.value.trim();
        codes = codesText.split(/[\s,;]+/).filter(code => code.trim() !== '');
        
        // Normaliser les codes en majuscules
        codes = codes.map(code => normalizeCode(code));
    }
    
    // Compléter ou tronquer les codes si nécessaire
    if (codes.length < daysInMonth) {
        appLogger.log(`Complétion des codes manquants (${codes.length} -> ${daysInMonth})`);
        while (codes.length < daysInMonth) {
            codes.push(''); // Code vide au lieu d'un code par défaut
        }
    } else if (codes.length > daysInMonth) {
        appLogger.log(`Troncature des codes excédentaires (${codes.length} -> ${daysInMonth})`);
        codes.splice(daysInMonth);
    }
    
    // Mettre à jour le résultat
    appState.results.codes = codes;
    
    // Envoyer un événement de succès de saisie manuelle
    sendAnalyticsEvent('manual_entry_success', {
        codes_count: codes.length,
        month: month,
        year: year
    });
    
    // Mettre à jour l'affichage
    displayResults(appState.results);
    
    // Afficher un message de succès
    showToast('Codes appliqués avec succès', 'success');
}

// Exposer les fonctions au niveau global
window.addManualEntryButton = addManualEntryButton;
window.showCalendarWithManualEntry = showCalendarWithManualEntry;
window.createManualEntryArea = createManualEntryArea;
window.switchTab = switchTab;
window.processManualCodes = processManualCodes;
