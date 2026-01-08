import { API_BASE_URL } from './apiConfig';

export async function getProfilePictureUrl(userId: string, token: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-picture`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json',
      },
    });
    if (response.ok) {
      // If the API returns a direct image URL, return it
      // If it returns the image as a blob, create an object URL
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      // If the API returns a JSON with a URL field
      try {
        const data = await response.json();
        if (data.url) return data.url;
      } catch {}
      return null;
    }
    return null;
  } catch {
    return null;
  }
}
