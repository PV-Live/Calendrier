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
    if (!appState.results || !appState.results.found) {
        showToast("Aucun résultat à exporter", "error");
        return;
    }
    
    const result = appState.results;
    const month = result.month;
    const year = result.year;
    const personName = result.name;
    const codes = result.codes;
    
    // Créer l'en-tête du fichier ICS
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendrier CHAL//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ].join('\r\n');
    
    // Ajouter les événements
    for (let day = 1; day <= codes.length; day++) {
        const code = codes[day - 1];
        
        if (!code) continue;
        
        // Créer la date de début
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day);
        
        // Définir les heures en fonction du code
        const hours = getCodeHours(code);
        
        // Si le code représente une journée entière (0 heures), définir comme un événement toute la journée
        let isAllDay = hours === 0;
        
        // Formater les dates
        let dtstart, dtend;
        
        if (isAllDay) {
            // Format pour les événements toute la journée
            dtstart = formatDateForICS(startDate, true);
            
            // Pour les événements toute la journée, la date de fin doit être le jour suivant
            endDate.setDate(endDate.getDate() + 1);
            dtend = formatDateForICS(endDate, true);
        } else {
            // Définir les heures de début et de fin
            startDate.setHours(8, 0, 0); // Par défaut, commencer à 8h
            dtstart = formatDateForICS(startDate);
            
            // Ajouter les heures à la date de début pour obtenir la date de fin
            endDate.setHours(startDate.getHours() + hours, 0, 0);
            dtend = formatDateForICS(endDate);
        }
        
        // Créer l'événement
        const summary = `${code} - ${getCodeDescription(code)}`;
        const description = `Code: ${code}\nHeures: ${hours}h\nPersonne: ${personName}`;
        
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
    }
    
    // Fermer le calendrier
    icsContent += '\r\nEND:VCALENDAR';
    
    // Créer le blob et le lien de téléchargement
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendrier-${personName.replace(/\s+/g, '-')}-${year}-${month.toString().padStart(2, '0')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast("Calendrier exporté avec succès", "success");
}

/**
 * Formate une date pour le format ICS
 * @param {Date} date - Date à formater
 * @param {boolean} dateOnly - Si true, ne formater que la date (sans l'heure)
 * @returns {string} - Date formatée
 */
function formatDateForICS(date, dateOnly = false) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    if (dateOnly) {
        return `${year}${month}${day}`;
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
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
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}-${code}-${random}@calendrier-chal`;
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

// Exposer les fonctions au niveau global
window.displayResults = displayResults;
window.getMonthName = getMonthName;
window.exportToICS = exportToICS;
window.exportToJSON = exportToJSON;
window.copyToClipboard = copyToClipboard;
