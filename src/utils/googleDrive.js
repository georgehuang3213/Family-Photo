// Upload files directly to Google Drive / Google One Storage via REST API
export async function uploadToGoogleDrive(file, accessToken) {
  if (!accessToken) {
    console.warn('Google Drive Token missing, falling back to cloud base64 storage');
    return null;
  }

  try {
    const metadata = {
      name: `FamilyPhoto_${Date.now()}_${file.name || 'photo.jpg'}`,
      mimeType: file.type || 'image/jpeg'
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!res.ok) {
      console.warn('Google Drive API response not OK:', res.statusText);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to upload directly to Google Drive:', err);
    return null;
  }
}
