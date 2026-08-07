// Validate Google Access Token validity
export async function validateGoogleToken(accessToken) {
  if (!accessToken) return false;
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Upload files directly to Google Drive / Google One Storage via REST API
export async function uploadToGoogleDrive(file, accessToken) {
  if (!accessToken) {
    return { success: false, error: '缺少 Google 雲端授權金鑰' };
  }

  try {
    // Step 1: Upload the file binary content (Simple Upload)
    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=media', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': file.type || 'image/jpeg'
      },
      body: file
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Google Drive Simple Upload failed. Status:', uploadRes.status, 'Response:', errText);
      
      let friendlyError = `HTTP ${uploadRes.status}: ${uploadRes.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) friendlyError = parsed.error.message;
      } catch {}
      
      return { success: false, error: `上傳失敗 (${friendlyError})` };
    }

    const fileInfo = await uploadRes.json();
    const fileId = fileInfo.id;

    if (!fileId) {
      return { success: false, error: '無法取得雲端檔案 ID' };
    }

    // Step 2: Update file metadata (name) using PATCH
    const metadataName = `FamilyPhoto_${Date.now()}_${file.name || 'photo.jpg'}`;
    const patchRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: metadataName
      })
    });

    if (!patchRes.ok) {
      const patchErrText = await patchRes.text();
      console.warn('Failed to update metadata for Drive file:', patchErrText);
    }

    // Step 3: Set public reader permissions
    try {
      const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
      });
      if (!permRes.ok) {
        const permErrText = await permRes.text();
        console.warn('Failed to set public reader permission on Drive file:', permErrText);
      }
    } catch (permErr) {
      console.warn('Could not set public permission on Google Drive file:', permErr);
    }

    return {
      success: true,
      id: fileId,
      name: metadataName,
      directImageUrl: `https://lh3.googleusercontent.com/d/${fileId}`
    };

  } catch (err) {
    console.error('Failed to upload directly to Google Drive:', err);
    return { success: false, error: err.message || '網路連線異常' };
  }
}

