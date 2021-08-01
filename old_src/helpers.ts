import {find, includes, isEmpty, omit, partial, property} from 'lodash';
import {MODERATOR_PERMISSIONS, LIVETHREAD_PERMISSIONS} from './constants';
import {emptyChildren as emptyMoreObject} from './objects/More';
import { Comment } from './objects/Comment';
import { Submission } from './objects/Submission';
import { PrivateMessage } from './objects/PrivateMessage';
import { Listing } from './objects/Listing';
import { $TSFIXME } from './ts-fix-me';
import { RedditContent } from './objects/index';

/**
* @summary Returns an unfetched empty replies Listing for an item.
* @param item An item without a replies Listing
* @returns The empty replies Listing
* @api private
*/
export function getEmptyRepliesListing<T extends Comment | Submission | PrivateMessage>(item: T): Listing<T> {
  if (item._name === 'Comment') {
    return item._r._newObject<Listing<T>>('Listing', {
      _uri: `comments/${(item?.link_id || item?.parent_id).slice(3)}`,
      _query: {comment: item.name?.slice(3)},
      _transform: property('comments[0].replies'),
      // @ts-expect-error
      _link_id: item.link_id,
      _isCommentList: true
    });
  }
  if (item._name === 'Submission') {
    return item._r._newObject<Listing<T>>('Listing', {
      // @ts-expect-error
      _uri: `comments/${item.id}`,
      _transform: property('comments'),
      _isCommentList: true
    });
  }
  return item._r._newObject<Listing<T>>('Listing');
}

/**
* @summary Adds an empty replies Listing to an item.
* @param item
* @returns The item with the new replies Listing
* @api private
*/
export function addEmptyRepliesListing (item: Comment | PrivateMessage): Comment | PrivateMessage {
  item.replies = getEmptyRepliesListing(item);
  return item;
}

export function handleJsonErrors<ValueType>(returnValue: ValueType) {
  return (response: any): ValueType => {
    if (isEmpty(response) || isEmpty(response.json.errors)) {
      return returnValue;
    }
    throw new Error(response.json.errors[0]);
  };
}

/**
* @summary Performs a depth-first search of a tree of private messages, in order to find a message with a given name.
* @param desiredName The fullname of the desired message
* @param rootNode The root message of the tree
* @returns The PrivateMessage with the given fullname, or undefined if it was not found in the tree.
* @api private
*/
export function findMessageInTree (desiredName: string, rootNode: PrivateMessage): PrivateMessage | undefined {
  return rootNode.name === desiredName ? rootNode : find(rootNode.replies?.map(partial(findMessageInTree, desiredName)));
}

/**
* Formats permissions into a '+'/'-' string.
* @param allPermissionNames All possible permissions in this category.
* @param permsArray The permissions that should be enabled.
* @returns The permissions formatted into a '+'/'-' string.
*/
export async function formatPermissions<T extends string>(allPermissionNames: readonly T[], permsArray: T[]) {
  return permsArray ? allPermissionNames.map(type => (includes(permsArray, type) ? '+' : '-') + type).join(',') : '+all';
}

export const formatModPermissions = (permsArray: typeof MODERATOR_PERMISSIONS) => formatPermissions(MODERATOR_PERMISSIONS, permsArray);
export const formatLivethreadPermissions = (permsArray: typeof LIVETHREAD_PERMISSIONS) => formatPermissions(LIVETHREAD_PERMISSIONS, permsArray);

/**
* @summary Renames a key on an object, omitting the old key
* @param {Object} obj
* @returns A version of the object with the key renamed
*/
export function renameKey (obj: Record<string, unknown>, oldKey: string, newKey: string) {
  return obj && omit({...obj, [newKey]: obj[oldKey]}, oldKey);
}

/**
* @summary Builds a replies tree from a list of child comments or messages
* @desc When reddit returns private messages (or comments from the /api/morechildren endpoint), it arranges their in a very
nonintuitive way (see https://github.com/not-an-aardvark/snoowrap/issues/15 for details). This function rearranges the message
tree so that replies are threaded properly.
* @param childList The list of child comments
* @returns The resulting list of child comments, arranged into a tree.
* @api private
*/
export function buildRepliesTree(childList: (Comment | PrivateMessage)[]): $TSFIXME[] {
  const childMap = childList
    .map(child => ({
      ...child,
      replies: getEmptyRepliesListing(child)
    }))
    .filter(child => child._name === 'Comment')
    .map(child => ({
      ...child, replies: {
        ...child.replies,
        _more: emptyMoreObject
      }
    }))
    .filter(child => childMap[child.parent_id])
    .forEach(child => {
      if (child.constructor._name === 'More') {
        childMap[child.parent_id].replies._setMore(child);
        child.link_id = childMap[child.parent_id].link_id;
      } else {
        childMap[child.parent_id].replies.push(child);
      }
    });

  return childList;
}

/**
* @summary Adds a fullname prefix to an item, if it doesn't have a prefix already. If the item is a RedditContent object, gets the item's fullname.
* @api private
*/
export function addFullnamePrefix (item: string | RedditContent, prefix: string) {
  if (typeof item === 'string') {
    return hasFullnamePrefix(item) ? item : prefix + item;
  }

  return item.name;
}

/**
* @summary Determines whether a string is a "fullname". A "fullname" starts with "t1_", "t2_", ... "t8_", or "LiveUpdateEvent_".
* @api private
*/
export function hasFullnamePrefix (item: string): boolean {
  return /^(t\d|LiveUpdateEvent)_/.test(item);
}

export function requiredArg (argName: string) {
  throw new TypeError(`Missing required argument ${argName}`);
}
