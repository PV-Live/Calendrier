/**
 * Calendrier Leo - Utilitaires pour le calendrier
 * Fonctions pour la création et l'exportation de calendriers
 */

/**
 * Crée un calendrier au format ICS (iCalendar)
 * 
 * @param {Object} days - Objet contenant les codes pour chaque jour
 * @param {string} personName - Nom de la personne
 * @param {number} month - Mois (1-12)
 * @param {number} year - Année
 * @param {Object} codeLegend - Légende des codes avec descriptions
 * @returns {string} - Contenu du fichier ICS
 */
function createICSCalendar(days, personName, month, year, codeLegend) {
    // Entête du calendrier ICS
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendrier Leo//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ].join('\r\n') + '\r\n';
    
    // Générer un événement pour chaque jour avec un code
    Object.entries(days).forEach(([day, code]) => {
        if (!code) return; // Ignorer les jours sans code
        
        // Obtenir les informations du code
        const codeInfo = codeLegend[code] || {
            description: `Code ${code}`,
            startTime: '09:00',
            endTime: '17:00',
            color: '#4285f4'
        };
        
        // Créer la date de début
        const [startHour, startMinute] = codeInfo.startTime.split(':').map(Number);
        const startDate = new Date(year, month - 1, parseInt(day), startHour || 9, startMinute || 0, 0);
        
        // Créer la date de fin
        const [endHour, endMinute] = codeInfo.endTime.split(':').map(Number);
        const endDate = new Date(year, month - 1, parseInt(day), endHour || 17, endMinute || 0, 0);
        
        // Si l'heure de fin est avant l'heure de début, ajouter un jour
        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }
        
        // Formater les dates au format ICS
        const startDateFormatted = formatDateForICS(startDate);
        const endDateFormatted = formatDateForICS(endDate);
        
        // Créer l'événement
        const event = [
            'BEGIN:VEVENT',
            `UID:${generateUID(personName, month, year, day)}`,
            `DTSTAMP:${formatDateForICS(new Date())}`,
            `DTSTART:${startDateFormatted}`,
            `DTEND:${endDateFormatted}`,
            `SUMMARY:${code} - ${codeInfo.description}`,
            `DESCRIPTION:Planning pour ${personName}: ${codeInfo.description}`,
            // Ajouter une couleur si disponible
            codeInfo.color ? `COLOR:${codeInfo.color.replace('#', '')}` : '',
            'END:VEVENT'
        ].filter(line => line).join('\r\n') + '\r\n';
        
        // Ajouter l'événement au calendrier
        icsContent += event;
    });
    
    // Fin du calendrier
    icsContent += 'END:VCALENDAR';
    
    return icsContent;
}

/**
 * Formate une date au format ICS
 * 
 * @param {Date} date - Date à formater
 * @returns {string} - Date formatée
 */
function formatDateForICS(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Génère un identifiant unique pour un événement
 * 
 * @param {string} personName - Nom de la personne
 * @param {number} month - Mois
 * @param {number} year - Année
 * @param {string} day - Jour
 * @returns {string} - Identifiant unique
 */
function generateUID(personName, month, year, day) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${timestamp}-${random}-${personName.replace(/\s/g, '')}-${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}@calendrierleopwa`;
}

/**
 * Convertit un mois numérique en nom de mois
 * 
 * @param {number} month - Mois (1-12)
 * @returns {string} - Nom du mois
 */
function getMonthName(month) {
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[month - 1];
}

/**
 * Obtient le nombre de jours dans un mois
 * 
 * @param {number} month - Mois (1-12)
 * @param {number} year - Année
 * @returns {number} - Nombre de jours
 */
function getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}
