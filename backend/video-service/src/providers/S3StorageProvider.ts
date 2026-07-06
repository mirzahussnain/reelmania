import { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageProvider } from "../interfaces/IStorageProvider";
import { createWriteStream } from "fs";
import { readFile } from "fs/promises";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export class S3StorageProvider implements IStorageProvider {
  private s3Client: S3Client;
  private s3PresignClient: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || "videos";
    
    // Internal client for server-to-MinIO operations (e.g. Delete)
    this.s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT, // e.g. http://minio:9000
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
      },
      forcePathStyle: true,
    });

    // Public client for generating Presigned URLs that the browser can use
    // We strip out the "/videos" part from S3_PUBLIC_DOMAIN to get the base endpoint
    const publicEndpoint = process.env.S3_PUBLIC_DOMAIN 
      ? process.env.S3_PUBLIC_DOMAIN.split(`/${this.bucketName}`)[0] 
      : "http://localhost:9000";

    this.s3PresignClient = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: publicEndpoint, // e.g. http://localhost:9000
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
      },
      forcePathStyle: true,
    });
  }

  async generateSignedUploadUrl(fileName: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      ContentType: contentType,
    });

    // Generate the URL using the presign client so the host in the signature matches the frontend's host
    const signedUrl = await getSignedUrl(this.s3PresignClient, command, { expiresIn: 900 });
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

  async downloadToFile(fileName: string, destPath: string): Promise<void> {
    // Use the internal (server-to-MinIO) client — the worker runs inside the
    // network and must not depend on the public presign host being reachable.
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: fileName });
    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Empty body downloading ${fileName}`);
    }
    await pipeline(response.Body as Readable, createWriteStream(destPath));
  }

  async uploadFile(fileName: string, filePath: string, contentType: string): Promise<string> {
    const body = await readFile(filePath);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: body,
      ContentType: contentType,
    });
    await this.s3Client.send(command);
    return this.getPublicUrl(fileName);
  }
}
