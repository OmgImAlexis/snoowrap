import { ModmailConversationAuthor } from './index';
import { RedditContent } from './RedditContent';
import { Subreddit } from './Subreddit';

/**
 * Represents the current status of a given Modmail conversation.
 */
export enum conversationStates {
  New,
  InProgress,
  Archived
};

/**
 * Represents all the possible states that is used within a Modmail conversations.
 */
export enum modActionStates {
  Highlight,
  UnHighlight,
  Archive,
  UnArchive,
  ReportedToAdmins,
  Mute,
  Unmute
};

/**
 * A class representing a conversation from new modmail.
 * 
 * @example
 *
 * // Get a Modmail Conversation with a given ID
 * r.getNewModmailConversation('75hxt')
 * @extends RedditContent
 */
export class ModmailConversation extends RedditContent {
  public readonly _name: string = 'ModmailConversation';
  id!: string;
  lastUnread?: null;

  static get conversationStates() {
    return conversationStates;
  }

  static get modActionStates() {
    return modActionStates;
  }

  get _uri() {
    return `api/mod/conversations/${this.id}?markRead=false`;
  }

  /**
   * Converts relevant fields in the ModmailConversation to snoowrap models.
   * @param response API Response
   * @return
   * @private
   */
  _transformApiResponse(response: {
    conversation: {
      owner: Subreddit
    },
    user: {
      name: string;
    }
  }) {
    response.conversation.owner = this._r._newObject<Subreddit>('Subreddit', {
    // @ts-expect-error
      id: response.conversation.owner.id,
    // @ts-expect-error
      display_name: response.conversation.owner.displayName
    });
    // @ts-expect-error
    response.conversation.participant = this._r._newObject('ModmailConversationAuthor', response.user.name, true);
    // @ts-expect-error
    for (let author of response.conversation.authors) {
      author = this._r._newObject('ModmailConversationAuthor', author, true);
    }

    // @ts-expect-error
    const conversationObjects = ModmailConversation._getConversationObjects(response.conversation, response);
    // @ts-expect-error
    return this._r._newObject<ModmailConversation>('ModmailConversation', {
      ...conversationObjects,
      ...response.conversation
    }, true);
  }

  /**
   * Maps objects to the ModmailConversation
   * @param conversation The conversation to map objects to
   * @param response API Response
   * @return
   * @private
   */
  static _getConversationObjects(conversation: { objIds: { id: string; key: string; }[] }, response: Record<string, Record<string, unknown>>) {
    const conversationObjects: Record<string, unknown[]> = {};
    for (const objId of conversation.objIds) {
      if (!conversationObjects[objId.key]) {
        conversationObjects[objId.key] = [];
      }
      conversationObjects[objId.key].push(response[objId.key][objId.id]);
    }
    return conversationObjects;
  }

  /**
   * Reply to current ModmailConversation
   * @param body Markdown text
   * @param isAuthorHidden Subreddit-name reply if true, user's name if false
   * @param isInternal If reply should be to internal moderators only
   * @return
   */
  async reply(body: string, isAuthorHidden: boolean = false, isInternal: boolean = false) {
    return this._post({
      uri: `api/mod/conversations/${this.id}`,
      form: {
        body,
        isAuthorHidden,
        isInternal
      }
    });
  }

  /**
   * Archives the ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').archive()
   */
  async archive() {
    return this._post<void>({ uri: `api/mod/conversations/${this.id}/archive` });
  }

  /**
   * Unarchives the ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').unarchive()
   */
  async unarchive() {
    return this._post<void>({ uri: `api/mod/conversations/${this.id}/unarchive` });
  }

  /**
   * Marks a ModmailConversation as highlighted
   * @example
   *
   * r.getNewModmailConversation('75hxt').highlight()
   */
  async highlight() {
    return this._post<void>({ uri: `api/mod/conversations/${this.id}/highlight` });
  }

  /**
   * Removed highlighted from a ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').unhighlight()
   */
  async unhighlight() {
    return this._delete<void>({ uri: `api/mod/conversations/${this.id}/highlight` });
  }

  /**
   * Mute the participant of the ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').mute()
   */
  async mute() {
    return this._post<void>({ uri: `api/mod/conversations/${this.id}/mute` });
  }

  /**
   * Unmute the participant of the ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').unmute()
   */
  async unmute() {
    return this._post<void>({ uri: `api/mod/conversations/${this.id}/unmute` });
  }

  /**
   * Marks the ModmailConversation as read
   * @example
   *
   * r.getNewModmailConversation('75hxt').read()
   */
  async read() {
    return this._r.markNewModmailConversationsAsRead([this.id]);
  }

  /**
   * Marks the ModmailConversation as unread.
   * 
   * @example
   *
   * r.getNewModmailConversation('75hxt').unread()
   */
  async unread() {
    return this._r.markNewModmailConversationsAsUnread([this.id]);
  }

  /**
   * Fetches the participant of the conversation.
   * 
   * @example
   *
   * r.getNewModmailConversation('75hxt').getParticipant().then(console.log)
   * // ModmailConversationAuthor { muteStatus: {...}, name: "SpyTec13", created: '2015-11-22T14:30:38.821292+00:00', ...}
   */
  async getParticipant() {
    return this._get<ModmailConversationAuthor>({ uri: `api/mod/conversations/${this.id}/user` })
      .then(res => {
        return this._r._newObject<ModmailConversationAuthor>('ModmailConversationAuthor', res, true);
      });
  }

  /**
   * Returns whether the ModmailConversation is read.
   * 
   * @return `true`, if read. `false` otherwise
   */
  isRead() {
    return this.lastUnread === null;
  }

  // @ts-expect-error
  get name() {
    return this.id;
  }
}
