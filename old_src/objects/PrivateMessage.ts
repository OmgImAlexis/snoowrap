import { buildRepliesTree, findMessageInTree } from '../helpers';
import { ReplyableContent } from './ReplyableContent';

/**
* A class representing a private message or a modmail.
* @example
*
* // Get a Private Message with a given ID
* r.getMessage('51shnw')
*/
export class PrivateMessage extends ReplyableContent {
  public readonly _name: string = 'PrivateMessage';
  declare public name: string;
  public replies?: PrivateMessage[];

  public get _uri() {
    return `message/messages/${this.name?.slice(3)}`;
  }

  _transformApiResponse(response: PrivateMessage[]) {
    response[0].replies = buildRepliesTree(response[0].replies || []);
    return findMessageInTree(this.name, response[0]);
  }

  /**
  * @summary Marks this message as read.
  * @returns A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsRead()
  */
  async markAsRead() {
    return this._r.markMessagesAsRead([this]).then(() => this);
  }

  /**
  * @summary Marks this message as unread.
  * @returns A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').markAsUnread()
  */
  async markAsUnread() {
    return this._r.markMessagesAsUnread([this]).then(() => this);
  }

  /**
  * @summary Mutes the author of this message for 72 hours. This can only be used on moderator mail.
  * @returns A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').muteAuthor()
  */
  async muteAuthor() {
    return this._post({ uri: 'api/mute_message_author', form: { id: this.name } }).then(() => this);
  }

  /**
  * @summary Unmutes the author of this message.
  * @returns A Promise that fulfills with this message after the request is complete
  * @example r.getMessage('51shxv').unmuteAuthor()
  */
  async unmuteAuthor() {
    return this._post({ uri: 'api/unmute_message_author', form: { id: this.name } }).then(() => this);
  }

  /**
  * @summary Deletes this message from the authenticated user's inbox.
  * @desc This only removes the item from the authenticated user's inbox. It has no effect on how the item looks to the sender.
  * @returns A Promise that fulfills with this message when the request is complete.
  * @example
  *
  * const firstMessage = r.getInbox().get(0);
  * firstMessage.deleteFromInbox();
  */
  async deleteFromInbox() {
    return this._post({ uri: 'api/del_msg', form: { id: this.name } }).then(() => this);
  }
};

