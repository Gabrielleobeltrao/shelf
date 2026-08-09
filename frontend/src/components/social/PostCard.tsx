import { useState } from "react";
import { Link } from "react-router-dom";
import { social, type PostView, type CommentView } from "../../lib/social";
import { useI18n } from "../../lib/i18n";
import { timeAgo } from "../../lib/timeAgo";
import { Avatar } from "./Avatar";
import { ChatIcon, StarIcon, TrashIcon, BookmarkIcon } from "../icons";
import { PhotoOrFallback } from "../ui/PhotoOrFallback";
import { linkify } from "../../lib/linkify";

function HeartIcon({ filled, className }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} className={className}>
      <path
        d="M10 16.5S3.5 12.5 3.5 7.8A3.3 3.3 0 0 1 10 6a3.3 3.3 0 0 1 6.5 1.8c0 4.7-6.5 8.7-6.5 8.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PostCard({ post, onDeleted }: { post: PostView; onDeleted?: (id: string) => void }) {
  const { t, lang } = useI18n();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post.likes);
  const [saved, setSaved] = useState(post.savedByMe);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [draft, setDraft] = useState("");

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const r = next ? await social.like(post.id) : await social.unlike(post.id);
      setLiked(r.likedByMe);
      setLikes(r.likes);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  }

  async function toggleSave() {
    const next = !saved;
    setSaved(next);
    try {
      const r = next ? await social.save(post.id) : await social.unsave(post.id);
      setSaved(r.savedByMe);
    } catch {
      setSaved(!next);
    }
  }

  async function toggleComments() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && comments.length === 0) {
      try {
        setComments(await social.comments(post.id));
      } catch {
        /* ignore */
      }
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      const c = await social.addComment(post.id, text);
      setComments((cs) => [...cs, c]);
      setCommentCount((n) => n + 1);
    } catch {
      /* ignore */
    }
  }

  async function del() {
    try {
      await social.deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      /* ignore */
    }
  }

  return (
    <article className="space-y-2 rounded-2xl bg-surface-2 p-4">
      <div className="flex items-center gap-3">
        <Link to={`/perfil/${post.author.handle}`}>
          <Avatar src={post.author.avatarUrl} name={post.author.name} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/perfil/${post.author.handle}`} className="block truncate font-display font-bold leading-tight">
            {post.author.name || `@${post.author.handle}`}
          </Link>
          <p className="truncate text-xs text-muted">
            @{post.author.handle} · {timeAgo(post.createdAt, lang)}
          </p>
        </div>
        {post.isMine && (
          <button onClick={del} aria-label={t.social.deletePost} className="shrink-0 text-muted">
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {post.place && (
        <Link
          to={`/lugar/${post.place.id}`}
          className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm"
        >
          <span className="min-w-0 flex-1 truncate font-medium">
            📍 {post.place.name}
            {post.place.city ? ` · ${post.place.city}` : ""}
          </span>
          {post.place.rating != null && (
            <span className="flex shrink-0 items-center gap-0.5 font-semibold text-mustard-600 dark:text-mustard-400">
              <StarIcon className="h-3.5 w-3.5" />
              {post.place.rating}
            </span>
          )}
        </Link>
      )}

      {post.recipe && (
        <div className="rounded-xl bg-surface px-3 py-2 text-sm font-medium">🍳 {post.recipe.name}</div>
      )}

      {post.text && <p className="whitespace-pre-wrap break-words text-sm">{linkify(post.text)}</p>}

      {post.photos && post.photos.length > 0 && (
        <div className={`grid gap-1.5 ${post.photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {post.photos.slice(0, 4).map((src, i) => (
            <PhotoOrFallback
              key={i}
              src={src}
              imgClassName="h-40 w-full rounded-xl object-cover"
              fallback={<div className="photo-fallback h-40 w-full rounded-xl" />}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-5 pt-1 text-sm text-muted">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 ${liked ? "text-rust-600 dark:text-rust-400" : ""}`}
        >
          <HeartIcon filled={liked} className="h-5 w-5" />
          {likes > 0 && <span className="tabular-nums">{likes}</span>}
        </button>
        <button onClick={toggleComments} className="flex items-center gap-1.5">
          <ChatIcon className="h-5 w-5" />
          {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
        </button>
        <button
          onClick={toggleSave}
          aria-label="save"
          className={`ml-auto ${saved ? "text-primary-600 dark:text-primary-400" : ""}`}
        >
          <BookmarkIcon className="h-5 w-5" filled={saved} />
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-line pt-2">
          {comments.map((c) => (
            <p key={c.id} className="text-sm">
              <span className="font-medium">{c.authorName}</span> {c.text}
            </p>
          ))}
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.social.addComment}
              className="min-w-0 flex-1 rounded-full bg-surface px-3 py-1.5 text-sm"
            />
            <button type="submit" className="shrink-0 rounded-full bg-primary-600 px-3 py-1.5 text-sm font-medium text-white">
              {t.social.send}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
