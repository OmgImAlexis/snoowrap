import { RedditContent } from "../objects/reddit-content";
import { hasFullnamePrefix } from "./has-fullname-prefix";

/**
* Returns an item's name with it's prefix.
*/
export function addFullnamePrefix (item: string | RedditContent, prefix: string) {
    if (typeof item === 'string') {
      return hasFullnamePrefix(item) ? item : prefix + item;
    }
  
    return item.name;
};
