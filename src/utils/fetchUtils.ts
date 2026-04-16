/**
 * Safely fetches data from a URL and parses it as JSON.
 * Handles non-JSON responses and network errors gracefully.
 */
export async function safeFetch<T>(url: string, options?: RequestInit, retries = 2): Promise<T> {
  try {
    // Automatically use proxy for HTTP URLs to avoid mixed content issues
    let fetchUrl = url;
    if (url.startsWith('http://')) {
      fetchUrl = `/api/proxy-book?url=${encodeURIComponent(url)}`;
    }
    
    const response = await fetch(fetchUrl, options);

    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 503) {
        throw new Error('Service Unavailable (503). The server might be overloaded.');
      }
      if (response.status === 404) {
        throw new Error(`Resource not found (404): ${url}`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      // Check if it's a "Service Unavailable" HTML page or similar
      if (text.includes('Service Unavailable') || text.includes('503')) {
        throw new Error('Server returned Service Unavailable instead of JSON.');
      }
      throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}. Response start: ${text.substring(0, 100)}`);
    }

    return await response.json() as T;
  } catch (error: any) {
    if (retries > 0 && (error.message.includes('Failed to fetch') || error.message.includes('503'))) {
      console.warn(`Fetch failed for ${url}, retrying... (${retries} left). Error: ${error.message}`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
      return safeFetch(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Safely fetches data from a URL and returns it as text.
 * Handles network errors gracefully.
 */
export async function safeFetchText(url: string, options?: RequestInit, retries = 2): Promise<string> {
  try {
    // Automatically use proxy for HTTP URLs to avoid mixed content issues
    let fetchUrl = url;
    if (url.startsWith('http://')) {
      fetchUrl = `/api/proxy-book?url=${encodeURIComponent(url)}`;
    }

    const response = await fetch(fetchUrl, options);

    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 503) {
        throw new Error('Service Unavailable (503). The server might be overloaded.');
      }
      if (response.status === 404) {
        throw new Error(`Resource not found (404): ${url}`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    // Check if it's a "Service Unavailable" HTML page or similar
    if (text.includes('Service Unavailable') || text.includes('503')) {
      throw new Error('Server returned Service Unavailable.');
    }

    return text;
  } catch (error: any) {
    if (retries > 0 && (error.message.includes('Failed to fetch') || error.message.includes('503'))) {
      console.warn(`Fetch failed for ${url}, retrying... (${retries} left). Error: ${error.message}`);
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
      return safeFetchText(url, options, retries - 1);
    }
    throw error;
  }
}
