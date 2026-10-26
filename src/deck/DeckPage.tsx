import { useEffect } from "react";
import DeckApp from "./ui/DeckApp";
import DECK_CONTENT from "./deck-content";

function updateMeta(selector: string, content: string) {
  const tag = document.querySelector<HTMLMetaElement>(selector);
  if (tag) tag.content = content;
}

export default function DeckPage() {
  useEffect(() => {
    document.title = DECK_CONTENT.meta.title;
    updateMeta('meta[name="description"]', DECK_CONTENT.meta.description);
    updateMeta('meta[property="og:title"]', DECK_CONTENT.meta.ogTitle);
    updateMeta('meta[property="og:description"]', DECK_CONTENT.meta.ogDescription);
    updateMeta('meta[name="twitter:title"]', DECK_CONTENT.meta.title);
    updateMeta('meta[name="twitter:description"]', DECK_CONTENT.meta.description);
  }, []);

  return <DeckApp config={DECK_CONTENT} />;
}
