// Use relative path so dev proxy works in dev and same-origin in prod
const getProfilePictureEndpoint = (userId: string) =>
  `/apis/rescue-link/v1/users/${userId}/profile-picture`;

export async function getProfilePictureUrl(userId: string, token: string): Promise<string | null> {
  try {
    const url = getProfilePictureEndpoint(userId);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'image/*',
      },
    });
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      try {
        const data = await response.json();
        if (data.url) return data.url;
      } catch {
        // ignore
      }
      return null;
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[GetProfilePicture] Failed to load profile picture for user ${userId}: ${response.status} ${response.statusText}`
      );
    }
    return null;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GetProfilePicture] Error loading profile picture for user', userId, err);
    }
    return null;
  }
}
