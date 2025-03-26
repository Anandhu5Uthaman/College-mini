/**
 * Creates a safe URL by ensuring proper protocol and base URL
 * @param {string} baseUrl - The base URL (optional)
 * @param {string} path - The path to append to the base URL
 * @returns {URL|null} - Returns a URL object or null if invalid
 */
export const createSafeUrl = (baseUrl, path) => {
    try {
        // Use window.location.origin as fallback if baseUrl is not provided
        const base = baseUrl || window.location.origin;
        
        // Ensure base URL has protocol
        const baseWithProtocol = /^https?:\/\//i.test(base) 
            ? base 
            : `http://${base}`;
            
        // Create and return URL object
        return new URL(path, baseWithProtocol);
    } catch (e) {
        console.error('Invalid URL construction:', e);
        return null;
    }
};

/**
 * Validates a URL string
 * @param {string} urlString - The URL string to validate
 * @returns {boolean} - Returns true if URL is valid
 */
export const isValidUrl = (urlString) => {
    try {
        new URL(urlString);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Adds query parameters to a URL
 * @param {string} baseUrl - The base URL
 * @param {Object} params - Object containing query parameters
 * @returns {string} - Returns URL string with query parameters
 */
export const addQueryParams = (baseUrl, params = {}) => {
    try {
        const url = new URL(baseUrl);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
        return url.toString();
    } catch (e) {
        console.error('Error adding query parameters:', e);
        return baseUrl;
    }
}; 