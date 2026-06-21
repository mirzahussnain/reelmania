import { Link } from "react-router-dom";
import { dateFormatter } from "../../utils/functions/formatter";
import { CommentType } from "../../types";

export const CommentItem = ({ comment }: { comment: CommentType }) => {
  return (
    <div className="w-full flex justify-start items-start p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
      <Link
        to={`/users/@${comment?.author?.username}`}
        className="w-10 h-10 shrink-0 rounded-full bg-surface-container-high p-[2px] hover:glow-primary transition-shadow"
      >
        <img
          className="w-full h-full object-cover rounded-full"
          src={comment?.author?.avatar_url}
          alt={comment?.author?.username}
        />
      </Link>
      <div className="flex-1 ml-3 flex flex-col justify-center items-start">
        <div className="w-full flex justify-start items-center gap-2">
          <Link
            to={`/users/@${comment?.author?.username}`}
            className="text-on-surface font-semibold text-sm hover:underline"
          >
            @{comment?.author?.username}
          </Link>
          <span className="text-on-surface-variant text-xs">
            {dateFormatter(new Date(comment?.posted_at))}
          </span>
        </div>
        <p className="w-full text-on-surface text-sm mt-1 leading-relaxed">
          {comment?.text}
        </p>
      </div>
    </div>
  );
};
