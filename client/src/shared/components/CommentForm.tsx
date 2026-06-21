import { ChangeEvent } from "react";

export const CommentForm = ({
  user,
  commentText,
  setCommentText,
  handleSumbit,
}: {
  user: any;
  commentText: string;
  setCommentText: (val: string) => void;
  handleSumbit: (e: ChangeEvent<HTMLFormElement>) => void;
}) => {
  return (
    <form
      className="w-full shrink-0 p-4 rounded-b-2xl border-t border-white/10 bg-surface-container/50 backdrop-blur-md"
      onSubmit={handleSumbit}
    >
      <div className="w-full flex justify-start items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-high p-[2px]">
          <img
            src={`${user?.avatar_url}`}
            className="w-full h-full object-cover rounded-full"
            alt={user?.username}
          />
        </div>
        <div className="flex-1 bg-surface-container-lowest rounded-xl p-3 border border-white/5 focus-within:border-primary/50 focus-within:glow-primary transition-all">
          <textarea
            className="w-full bg-transparent resize-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 min-h-[40px] max-h-[120px]"
            placeholder="Add a glowing comment..."
            onChange={(e) => setCommentText(e.target.value)}
            name="comments"
            value={commentText}
          />
        </div>
      </div>

      <div className="w-full flex justify-end items-center gap-2 mt-3">
        <button
          className="py-1.5 px-4 text-sm font-medium text-on-surface-variant hover:text-white hover:bg-white/5 rounded-full transition-colors"
          type="button"
          onClick={() => setCommentText("")}
        >
          Cancel
        </button>
        <button
          className="py-1.5 px-5 text-sm font-medium bg-primary text-on-primary hover:glow-primary hover:bg-primary-container transition-all rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={!commentText.trim()}
        >
          Post
        </button>
      </div>
    </form>
  );
};
