import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageProvider } from "../interfaces/IStorageProvider";

export class S3StorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || "videos";
    
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT, // Required for MinIO/Cloudflare
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async generateSignedUploadUrl(fileName: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      ContentType: contentType,
    });

    // URL expires in 15 minutes
    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    return signedUrl;
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });
      await this.s3Client.send(command);
      return true;
    } catch (err) {
      console.error("S3 delete error", err);
      return false;
    }
  }

  getPublicUrl(fileName: string): string {
    // For Cloudflare R2 / S3 with public access or MinIO public policy
    const endpoint = process.env.S3_PUBLIC_DOMAIN || `${process.env.S3_ENDPOINT}/${this.bucketName}`;
    return `${endpoint}/${fileName}`;
  }
}
