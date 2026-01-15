/**
 * Detects the correct API base URL for backend communication.
 * 
 * 1. Checks VITE_API_URL environment variable.
 * 2. Falls back to localhost:5000 if running locally (localhost/127.0.0.1).
 * 3. Otherwise, assumes the API is available at the current origin (e.g., /api).
 * 
 * @returns {string} The normalized base API URL without trailing slash.
 */
export const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;

    let base = '';

    if (envUrl) {
        base = envUrl;
    } else {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
            base = 'http://localhost:5000';
        } else {
            // In production, if not specified, use current origin
            base = window.location.origin;
        }
    }

    // Normalize: remove trailing slash
    if (base.endsWith('/')) {
        base = base.slice(0, -1);
    }

    return base;
};

/**
 * Returns the full path for a specific API endpoint.
 * Ensures /api prefix is added correctly if not present in base.
 * 
 * @param {string} endpoint - The endpoint path (e.g., '/reports/bulletin')
 * @returns {string} The full URL
 */
export const getApiEndpoint = (endpoint) => {
    const base = getApiUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // If base already includes /api, don't repeat it
    if (base.endsWith('/api')) {
        return `${base}${cleanEndpoint}`;
    }

    return `${base}/api${cleanEndpoint}`;
};
