const BASE_URL = import.meta.env.VITE_API_URL  ;

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any; // Ahora aceptamos objetos, strings, etc.
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const isJsonBody = options.body && typeof options.body === 'object' && !(options.body instanceof FormData);
  const url = `${BASE_URL}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: isJsonBody ? JSON.stringify(options.body) : options.body,
  };

  const response = await fetch(`${url}`, config);


  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    let errorMessage = "Ocurrió un error inesperado";
    try {
      const errorData = await response.json();

      errorMessage = errorData.error || JSON.stringify(errorData);
    } catch {
      errorMessage = response.statusText;
    }
    console.log(errorMessage)
    throw errorMessage;
  }

  if (response.status === 204) return {} as T;

  return response.json();
}
