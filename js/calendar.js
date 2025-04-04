/**
 * calendar.js
 * Affichage et exportation du calendrier pour l'application Calendrier CHAL
 */

/**
 * Affiche les résultats de l'analyse
 * @param {Object} result - Résultat de l'analyse
 */
function displayResults(result) {
    console.log("Affichage des résultats:", result);
    
    // Charger les remplacements d'exportation
    loadExportOverrides();
    
    if (!result || !result.found) {
        showToast("Aucun résultat trouvé", "error");
        return;
    }
    
    // Afficher la section des résultats
    if (elements.resultsSection) {
        elements.resultsSection.hidden = false;
    }
    
    if (elements.resultsContent) {
        elements.resultsContent.hidden = false;
    }
    
    // Créer le calendrier
    if (elements.calendarContainer) {
        elements.calendarContainer.innerHTML = '';
        
        // Créer le titre du calendrier
        const title = document.createElement('h3');
        title.textContent = `Planning de ${result.name} - ${getMonthName(result.month)} ${result.year}`;
        elements.calendarContainer.appendChild(title);
        
        // Créer le tableau du calendrier
        const table = document.createElement('table');
        table.className = 'calendar-table';
        
        // Créer l'en-tête du tableau
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Ajouter les jours de la semaine
        const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        daysOfWeek.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Créer le corps du tableau
        const tbody = document.createElement('tbody');
        
        // Calculer le premier jour du mois (0 = Dimanche, 1 = Lundi, ..., 6 = Samedi)
        const firstDay = new Date(result.year, result.month - 1, 1).getDay();
        const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1; // Ajuster pour commencer par Lundi
        
        // Calculer le nombre de jours dans le mois
        const daysInMonth = new Date(result.year, result.month, 0).getDate();
        
        // Calculer le nombre de semaines nécessaires
        const weeksNeeded = Math.ceil((firstDayAdjusted + daysInMonth) / 7);
        
        // Créer les lignes du tableau
        let day = 1;
        
        for (let week = 0; week < weeksNeeded; week++) {
            const row = document.createElement('tr');
            
            for (let weekday = 0; weekday < 7; weekday++) {
                const cell = document.createElement('td');
                
                if ((week === 0 && weekday < firstDayAdjusted) || day > daysInMonth) {
                    // Cellule vide
                    cell.className = 'empty-cell';
                } else {
                    // Cellule avec un jour
                    const dayNumber = document.createElement('div');
                    dayNumber.className = 'day-number';
                    dayNumber.textContent = day;
                    
                    const code = result.codes[day - 1] || '';
                    const codeElement = document.createElement('div');
                    codeElement.className = 'day-code';
                    
                    // Afficher les horaires au lieu du code
                    if (code) {
                        const codeData = appState.codesData[code];
                        if (codeData && codeData.startTime && codeData.endTime) {
                            codeElement.textContent = `${codeData.startTime}-${codeData.endTime}`;
                        } else if (code === 'C9E' || code === 'RH') {
                            // Pour les congés et repos, afficher le code
                            codeElement.textContent = code;
                        } else {
                            // Si pas d'horaires définis, afficher le code
                            codeElement.textContent = code;
                        }
                        
                        // Ajouter le code comme titre (tooltip)
                        codeElement.title = `${code} - ${getCodeDescription(code)}`;
                    } else {
                        codeElement.textContent = '';
                    }
                    
                    // Ajouter un sélecteur de code
                    const codeSelect = document.createElement('select');
                    codeSelect.className = 'code-dropdown';
                    codeSelect.dataset.day = day;
                    
                    // Ajouter l'option vide
                    const emptyOption = document.createElement('option');
                    emptyOption.value = '';
                    emptyOption.textContent = '-- Sélectionner --';
                    codeSelect.appendChild(emptyOption);
                    
                    // Ajouter les options pour chaque code
                    appState.validCodes.forEach(validCode => {
                        const option = document.createElement('option');
                        option.value = validCode;
                        option.textContent = `${validCode} - ${getCodeDescription(validCode)}`;
                        
                        if (validCode === code) {
                            option.selected = true;
                        }
                        
                        codeSelect.appendChild(option);
                    });
                    
                    // Ajouter un écouteur d'événement pour mettre à jour le code
                    codeSelect.addEventListener('change', function() {
                        const selectedCode = this.value;
                        const dayIndex = parseInt(this.dataset.day) - 1;
                        
                        // Mettre à jour le code dans le résultat
                        result.codes[dayIndex] = selectedCode;
                        
                        // Mettre à jour l'affichage
                        if (selectedCode) {
                            const codeData = appState.codesData[selectedCode];
                            if (codeData && codeData.startTime && codeData.endTime) {
                                codeElement.textContent = `${codeData.startTime}-${codeData.endTime}`;
                            } else if (selectedCode === 'C9E' || selectedCode === 'RH') {
                                // Pour les congés et repos, afficher le code
                                codeElement.textContent = selectedCode;
                            } else {
                                // Si pas d'horaires définis, afficher le code
                                codeElement.textContent = selectedCode;
                            }
                            
                            // Mettre à jour le code comme titre (tooltip)
                            codeElement.title = `${selectedCode} - ${getCodeDescription(selectedCode)}`;
                        } else {
                            codeElement.textContent = '';
                            codeElement.title = '';
                        }
                        
                        // Mettre à jour la couleur de la cellule
                        cell.style.backgroundColor = getCodeColor(selectedCode);
                        
                        console.log(`Code mis à jour pour le jour ${dayIndex + 1}: ${selectedCode}`);
                    });
                    
                    // Ajouter les éléments à la cellule
                    cell.appendChild(dayNumber);
                    cell.appendChild(codeElement);
                    cell.appendChild(codeSelect);
                    
                    // Définir la couleur de fond de la cellule
                    cell.style.backgroundColor = getCodeColor(code);
                    
                    // Ajouter une classe et une case à cocher pour les codes qui ne sont pas exportés
                    if (code) {
                        // Vérifier si le code doit être exporté
                        const shouldExport = shouldExportCode(code) || (appState.exportOverrides && appState.exportOverrides[day]);
                        
                        if (!shouldExport) {
                            // Ajouter la classe pour les hachures diagonales
                            cell.classList.add('not-exported');
                            
                            // Créer un conteneur pour la case à cocher
                            const checkboxContainer = document.createElement('div');
                            checkboxContainer.className = 'export-checkbox-container';
                            
                            // Créer la case à cocher
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.className = 'export-checkbox';
                            checkbox.id = `export-day-${day}`;
                            checkbox.dataset.day = day;
                            
                            // Vérifier si le code est déjà marqué pour être exporté
                            const isOverridden = appState.exportOverrides && appState.exportOverrides[day];
                            checkbox.checked = isOverridden || false;
                            
                            // Ajouter un écouteur d'événement pour mettre à jour les préférences d'exportation
                            checkbox.addEventListener('change', function() {
                                // Initialiser le tableau des remplacements s'il n'existe pas
                                if (!appState.exportOverrides) {
                                    appState.exportOverrides = {};
                                }
                                
                                // Mettre à jour le remplacement pour ce jour
                                appState.exportOverrides[day] = this.checked;
                                
                                // Sauvegarder les remplacements dans le localStorage
                                saveExportOverrides();
                                
                                // Mettre à jour l'apparence de la cellule
                                if (this.checked) {
                                    cell.classList.remove('not-exported');
                                } else {
                                    cell.classList.add('not-exported');
                                }
                                
                                console.log(`Jour ${day} (${code}): exportation ${this.checked ? 'activée' : 'désactivée'}`);
                            });
                            
                            // Ajouter la case à cocher au conteneur
                            checkboxContainer.appendChild(checkbox);
                            
                            // Ajouter le conteneur à la cellule
                            cell.appendChild(checkboxContainer);
                        }
                    }
                    
                    day++;
                }
                
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        elements.calendarContainer.appendChild(table);
        
        // Afficher les boutons d'exportation
        if (elements.exportButtons) {
            elements.exportButtons.hidden = false;
        }
    }
}

/**
 * Retourne le nom du mois
 * @param {number} month - Mois (1-12)
 * @returns {string} - Nom du mois
 */
function getMonthName(month) {
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return monthNames[month - 1] || '';
}

/**
 * Exporte le calendrier au format ICS
 */
function exportToICS() {
    console.log("=== DÉBUT FONCTION exportToICS ===");
    console.log("Étape 1: Vérification des résultats disponibles");
    
    if (!appState.results || !appState.results.found) {
        console.error("Aucun résultat à exporter - Arrêt de la fonction");
        showToast("Aucun résultat à exporter", "error");
        return;
    }
    
    console.log("Étape 2: Extraction des données des résultats");
    const result = appState.results;
    const month = result.month;
    const year = result.year;
    const personName = result.name;
    const codes = result.codes;
    
    console.log("Données extraites:", {
        personName,
        month,
        year,
        codesCount: codes.length,
        codes: codes.filter(Boolean).join(', ')
    });
    
    console.log("Étape 3: Création de l'en-tête du fichier ICS");
    // Créer l'en-tête du fichier ICS
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendrier CHAL//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ].join('\r\n');
    
    console.log("Étape 4: Ajout des événements au fichier ICS");
    // Ajouter les événements
    let eventCount = 0;
    for (let day = 1; day <= codes.length; day++) {
        const code = codes[day - 1];
        
        if (!code) {
            console.log(`Jour ${day}: Pas de code, événement ignoré`);
            continue;
        }
        
        console.log(`Traitement du jour ${day} avec code ${code}`);
        
        // Créer la date de début
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day);
        
        // Définir les heures en fonction du code
        const hours = getCodeHours(code);
        console.log(`Code ${code} pour le jour ${day}: ${hours} heures`);
        
        // Si le code représente une journée entière (0 heures), définir comme un événement toute la journée
        let isAllDay = hours === 0;
        console.log(`Événement toute la journée: ${isAllDay ? 'Oui' : 'Non'}`);
        
        // Formater les dates
        let dtstart, dtend;
        
        if (isAllDay) {
            // Format pour les événements toute la journée
            dtstart = formatDateForICS(startDate, true);
            
            // Pour les événements toute la journée, la date de fin doit être le jour suivant
            endDate.setDate(endDate.getDate() + 1);
            dtend = formatDateForICS(endDate, true);
            console.log(`Événement toute la journée: ${startDate.toLocaleDateString()} à ${endDate.toLocaleDateString()}`);
        } else {
            // Définir les heures de début et de fin en fonction du code
            // Extraire les heures de début et de fin à partir du code si disponible
            let startHour = 8; // Par défaut, commencer à 8h
            let endHour = startHour + hours;
            
            // Vérifier si le code a des heures spécifiques définies
            const codeData = appState.codesData[code];
            console.log(`Données du code ${code}:`, codeData);
            
            if (codeData && codeData.startTime) {
                // Format attendu: "HH:MM"
                const startTimeParts = codeData.startTime.split(':');
                if (startTimeParts.length === 2) {
                    startHour = parseInt(startTimeParts[0]);
                    const startMinute = parseInt(startTimeParts[1]);
                    startDate.setHours(startHour, startMinute, 0);
                    console.log(`Heure de début spécifique: ${startHour}:${startMinute}`);
                } else {
                    startDate.setHours(startHour, 0, 0);
                    console.log(`Heure de début par défaut: ${startHour}:00`);
                }
            } else {
                startDate.setHours(startHour, 0, 0);
                console.log(`Heure de début par défaut: ${startHour}:00`);
            }
            
            dtstart = formatDateForICS(startDate);
            console.log(`Date de début formatée: ${dtstart}`);
            
            if (codeData && codeData.endTime) {
                // Format attendu: "HH:MM"
                const endTimeParts = codeData.endTime.split(':');
                if (endTimeParts.length === 2) {
                    endHour = parseInt(endTimeParts[0]);
                    const endMinute = parseInt(endTimeParts[1]);
                    endDate.setHours(endHour, endMinute, 0);
                    console.log(`Heure de fin spécifique: ${endHour}:${endMinute}`);
                } else {
                    endDate.setHours(endHour, 0, 0);
                    console.log(`Heure de fin calculée: ${endHour}:00`);
                }
            } else {
                endDate.setHours(endHour, 0, 0);
                console.log(`Heure de fin calculée: ${endHour}:00`);
            }
            
            dtend = formatDateForICS(endDate);
            console.log(`Date de fin formatée: ${dtend}`);
        }
        
        // Créer l'événement
        const summary = `${code} - ${getCodeDescription(code)}`;
        const description = `Code: ${code}\nHeures: ${hours}h\nPersonne: ${personName}`;
        
        console.log(`Création de l'événement: ${summary}`);
        
        icsContent += '\r\n' + [
            'BEGIN:VEVENT',
            `UID:${generateUID(year, month, day, code)}`,
            `DTSTAMP:${formatDateForICS(new Date())}`,
            `DTSTART${isAllDay ? ';VALUE=DATE' : ''}:${dtstart}`,
            `DTEND${isAllDay ? ';VALUE=DATE' : ''}:${dtend}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            'END:VEVENT'
        ].join('\r\n');
        
        eventCount++;
    }
    
    // Fermer le calendrier
    icsContent += '\r\nEND:VCALENDAR';
    
    console.log(`Étape 5: Génération du fichier ICS terminée (${eventCount} événements)`);
    console.log("Contenu ICS généré, longueur:", icsContent.length);
    
    try {
        console.log("Étape 6: Création du blob et du lien de téléchargement");
        // Créer le blob et le lien de téléchargement
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        console.log("Blob créé:", blob.size, "octets");
        
        const url = URL.createObjectURL(blob);
        console.log("URL créée:", url);
        
        // Créer un élément de lien pour le téléchargement
        const a = document.createElement('a');
        a.href = url;
        const safePersonName = typeof personName === 'string' ? personName : String(personName || 'calendrier');
        a.download = `calendrier-${safePersonName.replace(/\s+/g, '-')}-${year}-${month.toString().padStart(2, '0')}.ics`;
        a.style.display = 'none';
        
        console.log("Étape 7: Ajout du lien au DOM et déclenchement du téléchargement");
        console.log("Nom du fichier:", a.download);
        
        // Ajouter l'élément au DOM, déclencher le clic, puis le supprimer
        document.body.appendChild(a);
        console.log("Lien ajouté au DOM");
        
        // Utiliser setTimeout pour s'assurer que le navigateur a le temps de traiter le lien
        setTimeout(() => {
            console.log("Déclenchement du clic sur le lien");
            a.click();
            
            // Nettoyer après le téléchargement
            setTimeout(() => {
                console.log("Nettoyage: suppression du lien et révocation de l'URL");
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log("Nettoyage terminé");
            }, 100);
        }, 0);
        
        console.log("Étape 8: Affichage du message de succès");
        showToast("Calendrier exporté avec succès", "success");
        console.log("=== FIN FONCTION exportToICS ===");
    } catch (error) {
        console.error("ERREUR lors de l'exportation ICS:", error);
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
        showToast("Erreur lors de l'exportation: " + error.message, "error");
        console.log("=== FIN FONCTION exportToICS (avec erreur) ===");
    }
}

/**
 * Formate une date pour le format ICS
 * @param {Date} date - Date à formater
 * @param {boolean} dateOnly - Si true, ne formater que la date (sans l'heure)
 * @returns {string} - Date formatée
 */
function formatDateForICS(date, dateOnly = false) {
    console.log("formatDateForICS - Date d'entrée:", date, "dateOnly:", dateOnly);
    
    // Créer une copie de la date pour ne pas modifier l'originale
    const dateCopy = new Date(date);
    
    const year = dateCopy.getFullYear();
    const month = (dateCopy.getMonth() + 1).toString().padStart(2, '0');
    const day = dateCopy.getDate().toString().padStart(2, '0');
    
    if (dateOnly) {
        const result = `${year}${month}${day}`;
        console.log("formatDateForICS - Résultat (date uniquement):", result);
        return result;
    }
    
    const hours = dateCopy.getHours().toString().padStart(2, '0');
    const minutes = dateCopy.getMinutes().toString().padStart(2, '0');
    const seconds = dateCopy.getSeconds().toString().padStart(2, '0');
    
    // Ne pas ajouter le Z pour garder l'heure locale
    // Cela est important pour les codes de nuit qui doivent être affichés aux heures locales
    const result = `${year}${month}${day}T${hours}${minutes}${seconds}`;
    console.log("formatDateForICS - Résultat (date et heure):", result);
    return result;
}

/**
 * Génère un UID unique pour un événement ICS
 * @param {number} year - Année
 * @param {number} month - Mois
 * @param {number} day - Jour
 * @param {string} code - Code
 * @returns {string} - UID
 */
function generateUID(year, month, day, code) {
    console.log("generateUID - Paramètres:", { year, month, day, code });
    
    // S'assurer que tous les paramètres sont du bon type
    const safeYear = String(year || new Date().getFullYear());
    const safeMonth = String(month || 1).padStart(2, '0');
    const safeDay = String(day || 1).padStart(2, '0');
    const safeCode = typeof code === 'string' ? code : String(code || 'CODE');
    
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const uid = `${safeYear}${safeMonth}${safeDay}-${safeCode}-${random}@calendrier-chal`;
    
    console.log("generateUID - UID généré:", uid);
    return uid;
}

/**
 * Exporte le calendrier au format JSON
 */
function exportToJSON() {
    if (!appState.results || !appState.results.found) {
        showToast("Aucun résultat à exporter", "error");
        return;
    }
    
    const blob = new Blob([JSON.stringify(appState.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendrier-${appState.results.name.replace(/\s+/g, '-')}-${appState.results.year}-${appState.results.month.toString().padStart(2, '0')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast("Données exportées avec succès", "success");
}

/**
 * Copie les codes dans le presse-papier
 */
function copyToClipboard() {
    if (!appState.results || !appState.results.found) {
        showToast("Aucun résultat à copier", "error");
        return;
    }
    
    const codes = appState.results.codes.join(', ');
    navigator.clipboard.writeText(codes)
        .then(() => {
            showToast("Codes copiés dans le presse-papier", "success");
        })
        .catch(err => {
            console.error('Erreur lors de la copie:', err);
            showToast("Erreur lors de la copie", "error");
        });
}

/**
 * Fonction appelée directement par le bouton d'exportation ICS
 * Cette fonction garantit le téléchargement du fichier ICS
 */
function downloadICSFile() {
    console.log("=== FONCTION downloadICSFile APPELÉE DIRECTEMENT PAR LE BOUTON ===");
    
    try {
        // S'assurer que les remplacements d'exportation sont chargés
        loadExportOverrides();
        
        if (!appState.results || !appState.results.found) {
            console.error("Aucun résultat à exporter - Arrêt de la fonction");
            showToast("Aucun résultat à exporter", "error");
            return;
        }
        
        console.log("Extraction des données des résultats");
        const result = appState.results;
        const month = result.month;
        const year = result.year;
        const personName = result.name;
        const codes = result.codes;
        
        console.log("Données extraites:", {
            personName,
            month,
            year,
            codesCount: codes.length,
            codes: codes.filter(Boolean).join(', ')
        });
        
        // Créer l'en-tête du fichier ICS
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Calendrier CHAL//FR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ].join('\r\n');
        
        // Ajouter les événements
        let eventCount = 0;
        for (let day = 1; day <= codes.length; day++) {
            const code = codes[day - 1];
            
            if (!code) {
                continue;
            }
            
            console.log(`Traitement du jour ${day} avec code ${code}`);
            
            // Vérifier si le code doit être exporté
            const shouldExport = shouldExportCode(code) || (appState.exportOverrides && appState.exportOverrides[day]);
            
            if (!shouldExport) {
                console.log(`Jour ${day} avec code ${code} non exporté (exclu par défaut et non remplacé)`);
                continue;
            }
            
            // Créer la date de début
            const startDate = new Date(year, month - 1, day);
            const endDate = new Date(year, month - 1, day);
            
            // Définir les heures en fonction du code
            const hours = getCodeHours(code);
            const codeData = appState.codesData[code];
            
            // Vérifier si le code a des heures spécifiques définies
            const hasSpecificTimes = codeData && codeData.startTime && codeData.endTime;
            
            // Désormais, on utilise toujours les heures précises si elles sont disponibles
            // On ne met plus d'événements sur toute la journée, sauf pour les codes sans heures (0)
            let isAllDay = hours === 0 && !hasSpecificTimes;
            
            // Formater les dates
            let dtstart, dtend;
            
            if (isAllDay) {
                // Format pour les événements toute la journée
                dtstart = formatDateForICS(startDate, true);
                
                // Pour les événements toute la journée, la date de fin doit être le jour suivant
                endDate.setDate(endDate.getDate() + 1);
                dtend = formatDateForICS(endDate, true);
            } else {
                // Définir les heures de début et de fin en fonction du code
                let startHour = 8; // Par défaut, commencer à 8h
                let startMinute = 0;
                let endHour = startHour + Math.floor(hours);
                let endMinute = Math.round((hours % 1) * 60);
                
                // Utiliser les heures spécifiques si disponibles
                if (hasSpecificTimes) {
                    // Format attendu: "HH:MM"
                    const startTimeParts = codeData.startTime.split(':');
                    if (startTimeParts.length === 2) {
                        startHour = parseInt(startTimeParts[0]);
                        startMinute = parseInt(startTimeParts[1]);
                    }
                    
                    const endTimeParts = codeData.endTime.split(':');
                    if (endTimeParts.length === 2) {
                        endHour = parseInt(endTimeParts[0]);
                        endMinute = parseInt(endTimeParts[1]);
                    }
                }
                
                // Vérifier si c'est un code de nuit
                const isNightShift = codeData && codeData.isOvernight;
                
                // Définir la date et l'heure de début
                startDate.setHours(startHour, startMinute, 0);
                dtstart = formatDateForICS(startDate);
                
                console.log(`Code: ${code}, isNightShift: ${isNightShift}, startTime: ${startHour}:${startMinute}, endTime: ${endHour}:${endMinute}`);
                
                // Gérer les codes de nuit (qui s'étendent sur deux jours)
                if (isNightShift) {
                    // Pour les codes de nuit, la date de fin est le jour suivant
                    endDate.setDate(endDate.getDate() + 1);
                    console.log(`Code de nuit détecté: ${code}, date de fin ajustée au jour suivant (${endDate.toISOString()})`);
                }
                
                // Définir la date et l'heure de fin
                endDate.setHours(endHour, endMinute, 0);
                dtend = formatDateForICS(endDate);
                
                console.log(`Événement final: du ${dtstart} au ${dtend}`);
                
                // Vérifier que l'heure de fin est après l'heure de début
                if (new Date(dtend) <= new Date(dtstart)) {
                    console.warn(`Attention: L'heure de fin (${dtend}) est avant ou égale à l'heure de début (${dtstart}) pour le code ${code} le jour ${day}`);
                    // Si ce n'est pas un quart de nuit, ajuster l'heure de fin pour qu'elle soit au moins 1 heure après le début
                    if (!isNightShift) {
                        endDate.setTime(startDate.getTime() + (60 * 60 * 1000)); // +1 heure
                        dtend = formatDateForICS(endDate);
                        console.log(`Heure de fin ajustée à ${dtend}`);
                    }
                }
            }
            
            // Créer l'événement
            const summary = `${code} - ${getCodeDescription(code)}`;
            let description = `Code: ${code}\nHeures: ${hours}h\nPersonne: ${personName}`;
            
            // Ajouter des informations sur les heures précises pour les codes de nuit
            if (codeData && codeData.isOvernight && codeData.startTime && codeData.endTime) {
                description += `\nHoraire: ${codeData.startTime} - ${codeData.endTime} (sur deux jours)`;
            }
            
            // Pour les codes de nuit, ajouter des propriétés supplémentaires
            const transparency = (codeData && codeData.isOvernight) ? 'TRANSPARENT' : 'OPAQUE';
            
            // Créer les propriétés de base de l'événement
            let eventProperties = [
                'BEGIN:VEVENT',
                `UID:${generateUID(year, month, day, code)}`,
                `DTSTAMP:${formatDateForICS(new Date())}`,
                `DTSTART${isAllDay ? ';VALUE=DATE' : ''}:${dtstart}`,
                `DTEND${isAllDay ? ';VALUE=DATE' : ''}:${dtend}`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${description}`,
                `TRANSP:${transparency}`
            ];
            
            // Pour les codes de nuit, ajouter des propriétés supplémentaires pour garantir l'affichage correct
            if (codeData && codeData.isOvernight) {
                // Ajouter une règle de récurrence pour indiquer qu'il s'agit d'un événement unique
                eventProperties.push('RRULE:FREQ=DAILY;COUNT=1');
                
                // Ajouter une propriété X-MICROSOFT-CDO-BUSYSTATUS pour les clients Microsoft
                eventProperties.push('X-MICROSOFT-CDO-BUSYSTATUS:BUSY');
                
                // Ajouter une propriété X-APPLE-TRAVEL-ADVISORY-BEHAVIOR pour les clients Apple
                eventProperties.push('X-APPLE-TRAVEL-ADVISORY-BEHAVIOR:AUTOMATIC');
            }
            
            // Fermer l'événement
            eventProperties.push('END:VEVENT');
            
            // Ajouter l'événement au contenu ICS
            icsContent += '\r\n' + eventProperties.join('\r\n');
            
            eventCount++;
        }
        
        // Fermer le calendrier
        icsContent += '\r\nEND:VCALENDAR';
        
        console.log(`Génération du fichier ICS terminée (${eventCount} événements)`);
        
        // Créer un élément a pour le téléchargement
        const safePersonName = typeof personName === 'string' ? personName : String(personName || 'calendrier');
        const fileName = `calendrier-${safePersonName.replace(/\s+/g, '-')}-${year}-${month.toString().padStart(2, '0')}.ics`;
        
        // Méthode 1: Utilisation de Blob et URL.createObjectURL
        console.log("Méthode 1: Utilisation de Blob et URL.createObjectURL");
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        console.log("Blob créé:", blob.size, "octets");
        
        const url = URL.createObjectURL(blob);
        console.log("URL créée:", url);
        
        // Créer un élément de lien pour le téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        // Ajouter l'élément au DOM, déclencher le clic, puis le supprimer
        document.body.appendChild(a);
        console.log("Lien ajouté au DOM, déclenchement du clic");
        a.click();
        
        // Nettoyer après le téléchargement
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("Nettoyage effectué");
        }, 1000);
        
        showToast("Calendrier exporté avec succès", "success");
    } catch (error) {
        console.error("ERREUR lors de l'exportation ICS:", error);
        console.error("Message d'erreur:", error.message);
        console.error("Stack trace:", error.stack);
        showToast("Erreur lors de l'exportation: " + error.message, "error");
    }
}

/**
 * Charge les remplacements d'exportation depuis le localStorage
 */
function loadExportOverrides() {
    const savedOverrides = localStorage.getItem('exportOverrides');
    if (savedOverrides) {
        try {
            appState.exportOverrides = JSON.parse(savedOverrides);
            console.log("Remplacements d'exportation chargés:", appState.exportOverrides);
        } catch (error) {
            console.error("Erreur lors du chargement des remplacements d'exportation:", error);
            appState.exportOverrides = {};
        }
    } else {
        appState.exportOverrides = {};
    }
}

/**
 * Sauvegarde les remplacements d'exportation dans le localStorage
 */
function saveExportOverrides() {
    if (appState.exportOverrides) {
        localStorage.setItem('exportOverrides', JSON.stringify(appState.exportOverrides));
    }
}

// Exposer les fonctions au niveau global
window.displayResults = displayResults;
window.getMonthName = getMonthName;
window.exportToICS = exportToICS;
window.exportToJSON = exportToJSON;
window.copyToClipboard = copyToClipboard;
window.downloadICSFile = downloadICSFile;
window.loadExportOverrides = loadExportOverrides;
