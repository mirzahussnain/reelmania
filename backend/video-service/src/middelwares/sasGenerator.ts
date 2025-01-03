
// import {  ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
// import { Request, Response } from 'express';
// import dotenv from "dotenv"
// import { connectBlobStorage } from '@utils/blob_connection.config';
// dotenv.config()



// export const sasGenerator =async (req: Request, res: Response) => {
//     try {
//         const blobClient = connectBlobStorage();
//         const accountName=process.env.AZURE_ACCOUNT_NAME
//         const sharedKey=process.env.AZURE_SHARED_KEY
//         const containerName = process.env.AZURE_BLOB_CONTAINER_NAME;
//         const accountURL=process.env.AZURE_ACCOUNT_URL
//        if(!accountName || !sharedKey || !containerName){
//         throw new Error("AZURE CREDENTIALS ARE MISSING")
//        }
//         const sharedKeyClient=new StorageSharedKeyCredential(accountName,sharedKey)
//         const containerClient = blobClient?.getContainerClient(containerName);
//         if (!containerClient?.containerName) {
//             throw new Error("Container name is undefined");
//         }
//         if(!containerClient?.exists){
//             throw new Error("No Container Exists with given name")
//         }
       
        
//         const sasOptions = {
//             containerName: containerClient.containerName,
//             permissions: ContainerSASPermissions.parse('rlacwd'),
//             expiresOn: new Date(new Date().valueOf() + 2 * 60 * 60 * 1000) // 2 hours


//         };
//         const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyClient).toString();
//         res.status(200).json({ sasToken: sasToken, containerUrl: containerClient.url,containerName:containerName,accountURL });
//     } catch (error) {
//         console.error('Error generating SAS token:', error);
//         res.status(500).send('Error generating SAS token');
//     }
// };