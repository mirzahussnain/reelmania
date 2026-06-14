import { IStorageProvider } from "../interfaces/IStorageProvider";
import { AzureStorageProvider } from "./AzureStorageProvider";
import { S3StorageProvider } from "./S3StorageProvider";

export class StorageFactory {
  static getProvider(): IStorageProvider {
    const provider = process.env.ACTIVE_STORAGE_PROVIDER?.toLowerCase() || "s3";

    switch (provider) {
      case "azure":
        return new AzureStorageProvider();
      case "s3":
      case "minio":
      case "cloudflare":
        return new S3StorageProvider();
      default:
        console.warn(`Storage provider '${provider}' not recognized, defaulting to S3`);
        return new S3StorageProvider();
    }
  }
}
