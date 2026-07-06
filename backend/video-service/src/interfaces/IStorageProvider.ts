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

  /**
   * Downloads a stored object to a local path. Used by the media-processing
   * worker to pull an uploaded video off storage for ffprobe/thumbnail extraction
   * (the bytes went straight to the bucket via presigned PUT, bypassing Node).
   * @param fileName The stored object key
   * @param destPath Local filesystem path to write the object to
   */
  downloadToFile(fileName: string, destPath: string): Promise<void>;

  /**
   * Uploads a local file to storage (e.g. a worker-extracted poster frame) and
   * returns its public read URL.
   * @param fileName The destination object key
   * @param filePath Local file to upload
   * @param contentType MIME type of the file (e.g. image/jpeg)
   */
  uploadFile(fileName: string, filePath: string, contentType: string): Promise<string>;
}
