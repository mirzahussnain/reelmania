import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";
import { exit } from "process";
dotenv.config();
export const connectBlobStorage = () => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) throw Error("Azure Storage connection string not found");
    const containerName = process.env.AZURE_BLOB_CONTAINER_NAME;
    if (!containerName) throw Error("Azure Storage container name not found");
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    return containerClient;
  } catch (err: any) {
    console.log(`VIDEO SERVICE STOPPED:${err?.message}`);
    exit();
  }
};
