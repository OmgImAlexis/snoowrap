import pTap from 'p-tap';
import { handleJsonErrors } from '../helpers';
import { RedditContent } from './RedditContent';

/**
* A set of mixin functions that apply to Submissions, Comments, and PrivateMessages
*/
export class ReplyableContent extends RedditContent {
  public readonly _name: string = 'ReplyableContent';
  declare public name: string;

  /**
  * Removes this Comment, Submission or PrivateMessage from public listings.
  * 
  * This requires the authenticated user to be a moderator of the subreddit with the `posts` permission.
  * @returns A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').remove({spam: true})
  */
  async remove({ spam = false }: {
    /**
     * Determines whether this should be marked as spam.
     */
    spam?: boolean
  }) {
    return this._post({ uri: 'api/remove', form: { spam, id: this.name } }).then(() => this);
  }

  /**
  * Approves this Comment, Submission, or PrivateMessage, re-adding it to public listings if it had been removed
  * @returns A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').approve()
  */
  async approve() {
    return this._post({ uri: 'api/approve', form: { id: this.name } }).then(() => this);
  }

  /**
  * Reports this content anonymously to subreddit moderators (for Comments and Submissions) or to the reddit admins (for PrivateMessages)
  * @returns A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').report({reason: 'Breaking the subreddit rules'})
  */
  async report({ reason }: {
    /** The reason for the report. */
    reason?: string
  } = {}) {
    return this._post({
      uri: 'api/report', form: {
        api_type: 'json', reason: 'other', other_reason: reason, thing_id: this.name
      }
    }).then(() => this);
  }

  /**
  * Ignores reports on this Comment, Submission, or PrivateMessage
  * @returns A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').ignoreReports()
  */
  async ignoreReports() {
    return this._post({ uri: 'api/ignore_reports', form: { id: this.name } }).then(() => this);
  }

  /**
  * Unignores reports on this Comment, Submission, or PrivateMessages
  * @returns A Promise that fulfills with this content when the request is complete
  * @example r.getComment('c08pp5z').unignoreReports()
  */
  async unignoreReports() {
    return this._post({ uri: 'api/unignore_reports', form: { id: this.name } }).then(() => this);
  }

  /**
  * Submits a new reply to this object. This takes the form of a new Comment if this object is a Submission/Comment, or a new PrivateMessage if this object is a PrivateMessage.
  * @returns A Promise that fulfills with the newly-created reply
  * @example r.getSubmission('4e60m3').reply('This was an interesting post. Thanks.');
  */
  async reply(
    /** The content of the reply, in raw markdown text. */
    text: string
  ) {
    return this._post({
      uri: 'api/comment',
      form: { api_type: 'json', text, thing_id: this.name }
    }).then(pTap(handleJsonErrors(this))).then(res => res.json.data.things[0]);
  }

  /**
  * Blocks the author of this content.
  * 
  * **Note:** In order for this function to have an effect, this item must be in the authenticated account's inbox or modmail somewhere.
  * The reddit API gives no outward indication of whether this condition is satisfied, so the returned Promise will fulfill even if this is not the case.
  * @returns A Promise that fulfills with this message after the request is complete
  * @example
  *
  * r.getInbox({limit: 1}).then(messages =>
  *   messages[0].blockAuthor();
  * );
  */
  async blockAuthor() {
    return this._post({ uri: 'api/block', form: { id: this.name } }).then(() => this);
  }
}
