import React, { useState, useEffect, useRef } from "react";
import { FaExchangeAlt, FaPlus } from "react-icons/fa";
import Modal from "react-modal";
import { useUploadVideoMutation } from "../utils/store/features/video/videoApi";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import { toast } from "react-toastify";
import { MutatingDots } from "react-loader-spinner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const UploadVideoModal = ({ isOpen, onClose }: Props) => {
  const [title, setTitle] = useState("");
  const [hashtags, setHashtags] = useState([""]);
  const [cachedFile, setCachedFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const { token } = useAppSelector((state: RootState) => state.auth);
  const user = useAppSelector((state: RootState) => state.user);
  const [postToMongo, response] = useUploadVideoMutation();
  const cacheTimerRef = useRef<(ReturnType<typeof setTimeout>) | null>(null);
  const [timeLeft, setTimeLeft] = useState(40);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isUploaded, setIsUploaded] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.info("Storing Video In Database...");
      const metaData = {
        Likes: [],
        comments: [],
        uploaded_by: {
          id: user?.id,
          username: user?.username,
        },
        title,
        hashtags,
        uploaded_at: new Date(),
      };
      if (!cachedFile) {
        throw new Error("File is not selected.");
      }
      const formData = new FormData();
      formData.append("video", cachedFile);
      formData.append("metadata", JSON.stringify(metaData));
      if (!token) {
        throw new Error("User is not signed in.");
      }
      await postToMongo({ formData, token }).unwrap();
      setCachedFile(null);
      setFileURL(null);
      setTitle("");
      setHashtags([]);
    } catch (err: any) {
      toast.error(err.toString());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) { // Example: 50MB limit
        toast.error("File size exceeds the maximum allowed limit (50MB).");
        return;
      }

      setCachedFile(selectedFile);
      const previewURL = URL.createObjectURL(selectedFile);
      setFileURL(previewURL);
      toast.warn("File will be removed after 40 seconds");

      setTimeLeft(40); // Reset countdown
      if (cacheTimerRef.current) {
        clearTimeout(cacheTimerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current as NodeJS.Timeout);
      }
  
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
        if(!isUploaded){

          toast.info("File Removed from cache.");
        }
      }, 40 * 1000);
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Reset input so the same file can be selected again
      fileInput.click();
    }
  };

  useEffect(() => {
    return () => {
      if (cacheTimerRef.current) clearTimeout(cacheTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (cachedFile) {
      const newFileURL = URL.createObjectURL(cachedFile);
      setFileURL(newFileURL);
    } else {
      setFileURL(null);
    }
  }, [cachedFile]);

  useEffect(() => {

      if (response?.isSuccess) {
        setIsUploaded(true);
        toast.success(`${response?.data?.message}`);
      } else if (response.isError && response?.data && response?.data?.message) {
        toast.error(JSON.stringify(response?.data?.message));
        setIsUploaded(false);
      }
  }, [response]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Upload Video Modal"
      className="modal w-full h-full flex flex-col justify-center items-center bg-gray-300 lg:p-4 lg:pt-9 overflow-hidden relative"
    >
      {fileURL && (<p className="absolute text-lg text-red-700/40 top-3 right-2 font-medium">{`File Rest in:${timeLeft} sec`}</p>)}
      <div className="w-full lg:w-[75%] h-full lg:h-[80%] flex flex-col justify-center items-center text-white lg:shadow-lg lg:shadow-black-">
        <h2 className="bg-gradient-to-r from-red-500 to-red-700 w-full text-center lg:rounded-t-2xl text-lg p-2 h-10">
          Upload New Video
        </h2>
        <form
          onSubmit={handleSubmit}
          className="w-full h-full bg-white rounded-b-2xl flex flex-col lg:flex-row justify-evenly items-center p-3"
          encType="multipart/form-data"
        >
          <div className="bg-gray-200/30 w-[15rem] lg:w-[26rem] h-[30rem] lg:h-full flex flex-col items-center justify-center border-2 border-dotted border-red-400 rounded-2xl">
            {response?.isLoading? 
            (<div className="w-full h-full flex flex-col justify-center items-center">
              <MutatingDots/>
              <h2 className="text-lg text-zinc-400">Uploading...</h2>
            </div>) : (
              <>
                <input
                  type="file"
                  id="fileInput"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                {fileURL ? (
                  <div className="w-full h-[20rem] lg:h-full rounded-2xl relative">
                    <video
                      className="w-full h-full object-cover rounded-2xl"
                      src={fileURL}
                      autoPlay
                      loop
                      muted
                    />
                    <button
                      className="p-2 text-white text-lg top-0 right-0 absolute"
                      title="Change Video"
                      onClick={triggerFileInput}
                      type="button"
                    >
                      <FaExchangeAlt />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center text-gray-400">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="p-2 bg-red-600 text-white rounded-full"
                    >
                      <FaPlus />
                    </button>
                    <h2>Upload Video</h2>
                    <span>(MP4, 1080p, 720p, 360p, etc.)</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="w-full flex flex-col items-start justify-start ml-4 h-full p-3">
            <div className="w-full flex flex-col items-start justify-start">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="title"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-red-500 focus:shadow-outline"
                required
              />
              <label
                className="block text-gray-700 text-sm font-bold mb-2 mt-4"
                htmlFor="hashtags"
              >
                Hashtags
              </label>
              <input
                type="text"
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value.toString().split(","))}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-red-500 focus:shadow-outline"
              />
            </div>
            <div className="w-full p-3 flex justify-center items-center mt-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Upload
              </button>
              <button
                type="button"
                onClick={onClose}
                className="ml-3 bg-red-500 hover:bg-red-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UploadVideoModal;
