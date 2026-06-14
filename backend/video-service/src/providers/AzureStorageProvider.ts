import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";
import { IStorageProvider } from "../interfaces/IStorageProvider";

export class AzureStorageProvider implements IStorageProvider {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.AZURE_BLOB_CONTAINER_NAME || "videos";

    if (!connectionString) {
      throw new Error("AZURE_STORAGE_CONNECTION_STRING is missing");
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async generateSignedUploadUrl(fileName: string, contentType: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(fileName);

    const sasOptions = {
      containerName: this.containerName,
      blobName: fileName,
      permissions: BlobSASPermissions.parse("cw"), // create, write
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 15 * 60 * 1000), // 15 minutes
      contentType: contentType
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      this.blobServiceClient.credential as any // DefaultAzureCredential or StorageSharedKeyCredential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlobClient(fileName);
      const response = await blobClient.deleteIfExists({ deleteSnapshots: "include" });
      return response.succeeded;
    } catch (err) {
      console.error("Azure delete error", err);
      return false;
    }
  }

  getPublicUrl(fileName: string): string {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(fileName);
    return blobClient.url;
  }
}
