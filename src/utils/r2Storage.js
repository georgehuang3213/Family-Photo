/**
 * Uploads a file directly to Cloudflare R2 using a secure serverless presigned URL.
 * 
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, url?: string, key?: string, error?: string}>}
 */
export async function uploadToR2(file) {
  try {
    // 1. Fetch secure presigned upload URL from our Vercel Serverless Function
    const res = await fetch(`/api/get-presigned-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type || 'image/jpeg')}`);
    
    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: errData.error || '無法取得伺服器上傳金鑰' };
    }

    const { uploadUrl, fileUrl, fileKey } = await res.json();

    if (!uploadUrl) {
      return { success: false, error: '伺服器未回傳有效上傳網址' };
    }

    // 2. Perform direct binary PUT upload to Cloudflare R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/jpeg'
      },
      body: file
    });

    if (!uploadRes.ok) {
      return { success: false, error: `Cloudflare R2 拒絕上傳 (${uploadRes.status}: ${uploadRes.statusText})` };
    }

    return {
      success: true,
      url: fileUrl,
      key: fileKey
    };

  } catch (err) {
    console.error('R2 Upload error:', err);
    return { success: false, error: err.message || '雲端傳輸網路連線異常' };
  }
}

/**
 * Deletes a file from Cloudflare R2 using the serverless deletion API.
 * 
 * @param {string} fileKey - The key of the file to delete (e.g. photos/123_photo.jpg)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromR2(fileKey) {
  if (!fileKey) return { success: false, error: '無效的檔案 Key' };
  try {
    const res = await fetch(`/api/delete-file?key=${encodeURIComponent(fileKey)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || '無法刪除 R2 實體檔案' };
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to delete file from R2:', err);
    return { success: false, error: err.message };
  }
}
