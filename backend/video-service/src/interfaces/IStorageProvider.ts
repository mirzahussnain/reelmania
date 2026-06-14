export interface IStorageProvider {
  /**
   * Generates a pre-signed URL for direct client upload.
   * @param fileName The unique name of the file to be uploaded
   * @param contentType The MIME type of the file (e.g. video/mp4)
   * @returns A promise that resolves to the pre-signed URL string
   */
  generateSignedUploadUrl(fileName: string, contentType: string): Promise<string>;

  /**
   * Deletes a file from the storage provider.
   * @param fileName The name of the file to delete
   */
  deleteFile(fileName: string): Promise<boolean>;

  /**
   * Returns the public read URL for the file.
   * @param fileName The name of the file
   */
  getPublicUrl(fileName: string): string;
}
