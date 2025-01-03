import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import dotenv from "dotenv";
import { exit } from "process";
dotenv.config();
export const connectBlobStorage = () => {
  try {
    
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const containerName=process.env.AZURE_BLOB_CONTAINER_NAME
    if (!accountName || !containerName) throw Error("Azure Storage accountName or containerName not found");

    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      new DefaultAzureCredential()
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    return containerClient;
  } catch (err: any) {
    console.log(`VIDEO SERVICE STOPPED:${err?.message}`);
    exit();
  }
};
