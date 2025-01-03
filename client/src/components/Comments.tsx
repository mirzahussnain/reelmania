import { IoFilter } from "react-icons/io5";
import { CommentType, VideoType } from "../types.ts";
import { dateFormatter, formatNumber } from "../utils/functions/formatter.ts";
import { FaX } from "react-icons/fa6";
import  { ChangeEvent, Key, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../utils/hooks/storeHooks.tsx";
import { RootState } from "../utils/store/store.ts";
import { useAddNewCommentMutation, useLazyGetCommentsByVideoIdQuery } from "../utils/store/features/video/videoApi.ts";
import { connectSocket } from "../utils/functions/socket.ts";
import { ThreeDots } from "react-loader-spinner";
import { IoIosArrowRoundDown, IoIosArrowRoundUp } from "react-icons/io";
import { toast } from "react-toastify";
import React from "react";

const Comments = ({
  video,
  setIsModalOpen,
}: {
  video: VideoType;
  setIsModalOpen: ({isOpen}:{isOpen:boolean})=>void
}) => {
  const user = useAppSelector((state: RootState) => state.user);
  const token = useAppSelector((state: RootState) => state.auth.token);
  const [commentText, setCommentText] = useState("");
  const [videoComments, setVideoComments] = useState<CommentType[]>([]);
  const [postComment] = useAddNewCommentMutation();
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState(false);
  const socket = token ? connectSocket(token) : null;
  const [getComments] = useLazyGetCommentsByVideoIdQuery();

  // Handle Submit
  const handleSumbit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setPending(true);
      if (!commentText.trim()) throw new Error("Please write something first.");

      const comment: CommentType = {
        author: {
          id: user?.id,
          username: user?.username,
          avatar_url: user?.avatar_url,
        },
        posted_at: new Date(),
        text: commentText,
      };

      if (!video?.id) throw new Error("Video ID is missing.");
      if (!token) throw new Error("Token is missing.");
      const query = await postComment({
        comment,
        videoId: video?.id,
        token,
      }).unwrap();
      if (query) {
        setCommentText("");
        toast.success(query?.message);
        if(videoComments.every((comment:CommentType)=>comment.author.id!==user?.id)){

            setVideoComments([query?.newComments, ...videoComments]);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment.");
    } finally {
      setPending(false);
    }
  };


  useEffect(() => {
    if (video?.id) {
      const fetchComments = async (videoId: string) => {
        try {
          const query = await getComments(videoId).unwrap();
          if (query && query?.comments) {
            setVideoComments(query?.comments);
          }
        } catch (err) {
          console.log(err);
        }
      };
      if(video?.id){

        fetchComments(video?.id);
      }
    }
  }, []);

  useEffect(() => {
    if (filter) {
        let comments=[...videoComments];

      setVideoComments(comments.sort((a,b)=>new Date(a.posted_at).getTime()-new Date(b.posted_at).getTime()));
    } else {
        let comments=[...videoComments];

        setVideoComments(comments.sort((a,b)=>new Date(b.posted_at).getTime()-new Date(a.posted_at).getTime()));
    }
  }, [filter]);

  useEffect(() => {
    try {
      if (!socket) return;
      socket.connect();
      socket.on("newCommentAdded", ({ newComment }) => {
        if (newComment) {
          setVideoComments((prevComments) => [newComment, ...prevComments]);
        } else {
          toast.error("Invalid video data received");
        }
      });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to connect to socket.");
      } else {
        toast.error("Failed to connect to socket.");
      }

    }

    return () => {
      socket?.off("newCommentAdded");
      socket?.disconnect();
    };
  }, [socket]);

  return (
    <div className="w-full h-full lg:w-[30rem] bg-black/40 border-[1px] border-zinc-400/40 flex flex-col justify-start items-center  rounded-2xl">
      <div className="w-full h-12 py-2 px-4 flex justify-between items-center text-white border-b-[1px] border-zinc-400/40
      bg-gradient-to-r from-red-500/30 to-red-700 rounded-t-2xl">
        <h2 className="text-xl tracking-wider font-semibold font-Lato ">
          Comments
          <span className="text-lg text-zinc-500 font-normal ml-2 font-Lato">
            {formatNumber(videoComments?.length || 0)}
          </span>
        </h2>
        <div className="flex justify-center items-center px-3">
          <button
            className={`text-2xl ${filter?"text-white":"text-zinc-300"} mr-10 flex items-center justify-center`}
            onClick={() => setFilter((prev) => !prev)}
          >
            <IoFilter /> {filter?<IoIosArrowRoundUp/>:<IoIosArrowRoundDown/>}
          </button>
          <button
            className="font-thin text-xl text-zinc-300"
            onClick={() => setIsModalOpen({isOpen:false})} // Use null to close modal
          >
            <FaX />
          </button>
        </div>
      </div>

      {pending ? (
        <ThreeDots />
      ) : (
        <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-zinc-800/80 to-white/20 backdrop-filter backdrop-blur-2xl flex flex-col items-center justify-start scrollbar-custom transition-all ease-linear duration-500">
          {videoComments?.length > 0 ? (
            videoComments?.map((comment: CommentType, index: Key) => {
              return (
                <div
                  key={index}
                  className={`w-full h-[6rem] flex justify-center items-center p-3 border-[1px] border-zinc-400/40`}
                >
                  <Link
                    to={`/users/@${comment?.author?.username}`}
                    className={`w-11 h-11 rounded-full  bg-white/70 p-[2px]`}
                  >
                    <img
                      className={`w-full h-full object-cover rounded-full`}
                      src={comment?.author?.avatar_url}
                    />
                  </Link>
                  <div
                    className={`w-full h-full ml-2 flex-col justify-center items-start p-3`}
                  >
                    <div className={`w-full flex justify-start items-end`}>
                      <Link
                        to={`/`}
                        className={`text-white mx-2 ${
                          videoComments?.some(
                            (videoComment) =>
                              comment?.author?.id ==
                              videoComment?.author?.username
                          )
                            ? "bg-zinc-200"
                            : ""
                        }`}
                      >
                        @{comment?.author?.username}
                      </Link>
                      <span
                        className={`text-zinc-400 text-sm font-normal ml-2`}
                      >
                        {dateFormatter(new Date(comment?.posted_at))}
                      </span>
                    </div>
                    <p
                      className={`w-full text-white text-[0.8rem] ml-2 text-justify mt-2 font-Inter`}
                    >
                      {comment?.text}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <h2 className="text-zinc-300 font-semibold text-2xl font-Lato">
              {"No Comments Yet"}
            </h2>
          )}
        </div>
      )}

      <form
        className={
          "w-full h-[7rem] rounded-b-2xl flex flex-col justify-center items-center px-3 border-t-2 border-zinc-400/40 bg-gradient-to-r from-red-500/30 to-red-700"
        }
        onSubmit={handleSumbit}
      >
        <div className={`w-full h-[4rem] flex justify-center items-start pt-2`}>
          <Link to={``} className={`w-12 h-12 rounded-full`}>
            <img
              src={`${user?.avatar_url}`}
              className={`w-full h-full object-cover rounded-full`}
            />
          </Link>
          <div
            className={`w-full ml-4 border-b-2 border-white/20 h-[1.9rem] transition-all duration-500 ease-in-out focus-within:border-white relative`}
          >
            <textarea
              className={`w-full h-full bg-transparent resize-none text-sm outline-0 text-zinc-300 placeholder:text-zinc-400/50`}
              placeholder={`Write Your Comments`}
              onChange={(e) => setCommentText(e.target.value)}
              name="comments"
              value={commentText}
            />
          </div>
        </div>

        <div className={`w-full h-full flex justify-end items-center py-2`}>
          <button
            className={`py-2 px-6 bg-black hover:bg-zinc-600 text-white rounded-full`}
            type={"button"}
            onClick={() => setCommentText("")}
          >
            Cancel
          </button>
          <button
            className={`py-2 px-6 bg-blue-400 hover:bg-blue-600 text-white rounded-full ml-3 tracking-wider`}
            type={"submit"}
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(Comments, (prevProps, nextProps) => {
  return prevProps.video.id === nextProps.video.id;
});