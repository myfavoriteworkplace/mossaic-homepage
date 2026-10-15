import deckPresentation from "../data/deck-presentation.json";
import { DeckPresentationSchema } from "./ui/schema";

// Shared business facts remain in src/data; only deck presentation and demo
// content live in the deck-specific JSON file.
const DECK_CONTENT = DeckPresentationSchema.parse(deckPresentation);

export default DECK_CONTENT;
