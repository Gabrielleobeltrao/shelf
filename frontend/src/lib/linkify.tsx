import { Link } from "react-router-dom";

// Turn @mentions and #hashtags inside post text into links.
export function linkify(text: string) {
  return text.split(/(@[a-z0-9_]+|#[\p{L}0-9_]+)/giu).map((part, i) => {
    if (/^@[a-z0-9_]+$/i.test(part)) {
      return (
        <Link key={i} to={`/perfil/${part.slice(1).toLowerCase()}`} className="font-medium text-primary-600 dark:text-primary-400">
          {part}
        </Link>
      );
    }
    if (/^#[\p{L}0-9_]+$/u.test(part)) {
      return (
        <Link key={i} to={`/tag/${part.slice(1).toLowerCase()}`} className="font-medium text-primary-600 dark:text-primary-400">
          {part}
        </Link>
      );
    }
    return part;
  });
}
