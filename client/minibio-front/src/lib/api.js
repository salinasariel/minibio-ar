const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 *
 * @param {string} endpoint 
 * @param {string} [token] 
 * @param {object} [options] 
 * @returns {Promise<any>} 
 */
export async function apiFetch(endpoint, token = null, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición a la API');
  }

  return data; 
}