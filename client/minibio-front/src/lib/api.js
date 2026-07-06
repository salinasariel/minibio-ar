const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Wrapper de fetch para la API.
 * Si la API devuelve 401 (token vencido/inválido), limpia la sesión
 * y redirige al login.
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

  // Sesión vencida: limpiar y mandar al login (solo si había token)
  if (response.status === 401 && token && typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login?expired=1';
    throw new Error('Sesión expirada');
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // respuesta sin body
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Error en la petición a la API');
  }

  return data;
}
