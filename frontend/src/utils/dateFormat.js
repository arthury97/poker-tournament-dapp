/**
 * Format date string to readable format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Dec 15, 2025")
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'TBD';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format date range (start and end dates)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} Formatted date range (e.g., "Dec 15 - 22, 2025")
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate) return 'TBD';
  
  try {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const startFormatted = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: end ? undefined : 'numeric'
    });
    
    if (end && start.getFullYear() === end.getFullYear()) {
      // Same year - show "Dec 15 - 22, 2025"
      if (start.getMonth() === end.getMonth()) {
        // Same month - show "Dec 15 - 22, 2025"
        const endFormatted = end.toLocaleDateString('en-US', {
          day: 'numeric',
          year: 'numeric'
        });
        return `${startFormatted} - ${endFormatted}`;
      } else {
        // Different months - show "Dec 15 - Jan 22, 2025"
        const endFormatted = end.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        return `${startFormatted} - ${endFormatted}`;
      }
    } else if (end) {
      // Different years - show full dates
      const endFormatted = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${startFormatted} - ${endFormatted}`;
    }
    
    return startFormatted;
  } catch (error) {
    return startDate + (endDate ? ` - ${endDate}` : '');
  }
};

/**
 * Get full date range display with start and end clearly labeled
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {object} Object with start and end formatted dates
 */
export const getDateRangeDisplay = (startDate, endDate) => {
  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
    range: formatDateRange(startDate, endDate)
  };
};

