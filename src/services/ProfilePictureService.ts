import { API_BASE_URL } from './apiConfig';

export async function updateProfilePicture(userId: string, file: File, token: string): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // 'Content-Type' should NOT be set for FormData; browser sets it automatically
      'accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error text');
    throw new Error(`Profile picture update failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}
