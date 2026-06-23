import { useState, useRef, useEffect } from "react";
import { useUploadVideoMutation, useGenerateUploadUrlMutation } from "../../utils/store/features/video/videoApi";
import { useCurrentUser } from "./useCurrentUser";
import { toast } from "react-toastify";

export const useVideoUpload = (onSuccess?: () => void) => {
  const [title, setTitle] = useState("");
  const [hashtags, setHashtags] = useState([""]);
  const [cachedFile, setCachedFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(40);
  const [isUploaded, setIsUploaded] = useState(false);

  const { user, token } = useCurrentUser();

  const [postToMongo, { isLoading: isSavingMetadata }] = useUploadVideoMutation();
  const [generateUploadUrl] = useGenerateUploadUrlMutation();
  
  const cacheTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isUploadingToS3, setIsUploadingToS3] = useState(false);

  const isPending = isSavingMetadata || isUploadingToS3;

  const resetForm = () => {
    setCachedFile(null);
    setFileURL(null);
    setTitle("");
    setHashtags([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size exceeds the maximum allowed limit (50MB).");
        return;
      }

      setCachedFile(selectedFile);
      setFileURL(URL.createObjectURL(selectedFile));
      toast.warn("File will be removed after 40 seconds if not uploaded");

      setTimeLeft(40);
      if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current as NodeJS.Timeout);
  
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current as NodeJS.Timeout);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
  
      cacheTimerRef.current = setTimeout(() => {
        setFileURL(null);
        if (!isUploaded) toast.info("File preview removed from cache.");
      }, 40 * 1000);
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!cachedFile) throw new Error("File is not selected.");
      if (!token) throw new Error("User is not signed in.");
      if (!title.trim()) throw new Error("Title is required.");

      toast.info("Initializing Upload...");

      // Step 1: Generate Pre-Signed URL
      setIsUploadingToS3(true);
      const uploadUrlRes = await generateUploadUrl({
        fileName: cachedFile.name,
        contentType: cachedFile.type,
        token
      }).unwrap();
      const { signedUrl, fileName } = uploadUrlRes.data;

      // Step 2: Upload directly to S3
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: cachedFile,
        headers: { "Content-Type": cachedFile.type },
      });
      setIsUploadingToS3(false);

      if (!uploadRes.ok) throw new Error("Direct storage upload failed.");

      // Step 3: Save metadata to MongoDB
      toast.info("Storing Video Metadata...");
      const metaData = {
        Likes: [],
        comments: [],
        uploaded_by: { id: user?.id, username: user?.username },
        title,
        hashtags,
        uploaded_at: new Date(),
      };
      
      const response = await postToMongo({ metadata: metaData, fileName, token }).unwrap();
      
      setIsUploaded(true);
      toast.success(response.message || "Video Uploaded Successfully!");
      resetForm();
      if (onSuccess) onSuccess();

    } catch (err) {
      setIsUploadingToS3(false);
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    return () => {
      if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    title,
    setTitle,
    hashtags,
    setHashtags,
    fileURL,
    timeLeft,
    isPending,
    isUploadingToS3,
    handleFileChange,
    triggerFileInput,
    handleSubmit,
    resetForm
  };
};
