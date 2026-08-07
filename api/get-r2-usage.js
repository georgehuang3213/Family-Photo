import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'family-photo';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return res.status(500).json({ error: "Cloudflare R2 金鑰未於伺服器端環境變數配置" });
  }

  try {
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    let totalSizeBytes = 0;
    let totalObjects = 0;
    let isTruncated = true;
    let continuationToken = undefined;

    // Paginate through all object keys on Cloudflare R2
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });

      const response = await s3.send(command);
      const contents = response.Contents || [];

      totalObjects += contents.length;
      for (const obj of contents) {
        totalSizeBytes += obj.Size || 0;
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }

    const usedMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
    const usedGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(3);

    return res.status(200).json({
      success: true,
      bucketName,
      totalObjects,
      totalSizeBytes,
      usedMB: parseFloat(usedMB),
      usedGB: parseFloat(usedGB),
      limitGB: 10
    });
  } catch (err) {
    console.error("Failed to query Cloudflare R2 usage:", err);
    return res.status(500).json({ error: err.message || "無法取得 R2 實時儲存用量" });
  }
}
