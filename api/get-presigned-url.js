import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  // Setup CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { filename, contentType } = req.query;
  if (!filename || !contentType) {
    return res.status(400).json({ error: "Missing filename or contentType" });
  }

  // Validate that the request is actually for an image type
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: "Only image files are allowed for upload" });
  }

  // Ensure Cloudflare R2 environment variables are present
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return res.status(500).json({ error: "Cloudflare R2 storage credentials are not configured on the server." });
  }

  try {
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const fileKey = `photos/${Date.now()}_${filename.replace(/\s+/g, '_')}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    // Generate secure upload link valid for 5 minutes (300 seconds)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    
    // Resolve the clean access URL
    const fileUrl = publicUrl 
      ? `${publicUrl.replace(/\/$/, '')}/${fileKey}`
      : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;

    return res.status(200).json({ uploadUrl, fileUrl, fileKey });
  } catch (err) {
    console.error("Failed to generate presigned R2 upload URL:", err);
    return res.status(500).json({ error: err.message || "Failed to generate presigned upload URL" });
  }
}
