import pTap from 'p-tap';
import { handleJsonErrors } from '../helpers';
import { ReplyableContent } from './ReplyableContent';
import { Comment } from './Comment';
import { Listing } from './Listing';

/**
* A set of mixin functions that apply to Submissions and Comments.
* <style> #VoteableContent {display: none} </style>
*/
export class VoteableContent extends ReplyableContent {
  public readonly _name: string = 'VoteableContent';
  comments?: Listing<Comment>;

  /**
  * Casts a vote on this Comment or Submission.
  * @private
  * @param direction The direction of the vote. (1 for an upvote, -1 for a downvote, 0 to remove a vote)
  * @returns A Promise that fulfills when the request is complete.
  */
  async _vote(direction: number) {
    return this._post({ uri: 'api/vote', form: { dir: direction, id: this.name } }).then(() => this);
  }

  /**
  * Upvotes this Comment or Submission.
  * @returns A Promise that fulfills with this Comment/Submission when the request is complete
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK,
  but bots deciding how to vote on content or amplifying a human's vote are not. See the
  [reddit rules](https://reddit.com/rules) for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').upvote()
  */
  async upvote() {
    return this._vote(1);
  }

  /**
  * Downvotes this Comment or Submission.
  * @returns A Promise that fulfills with this Comment/Submission when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').downvote()
  */
  async downvote() {
    return this._vote(-1);
  }

  /**
  * Removes any existing vote on this Comment or Submission.
  * @returns A Promise that fulfills with this Comment/Submission when the request is complete.
  * @desc **Note: votes must be cast by humans.** That is, API clients proxying a human's action one-for-one are OK, but
  bots deciding how to vote on content or amplifying a human's vote are not. See the [reddit rules](https://reddit.com/rules)
  for more details on what constitutes vote cheating. (This guideline is quoted from
  [the official reddit API documentation page](https://www.reddit.com/dev/api#POST_api_vote).)
  * @example r.getSubmission('4e62ml').unvote()
  */
  async unvote() {
    return this._vote(0);
  }

  /**
  * Saves this Comment or Submission (i.e. adds it to the list at reddit.com/saved)
  * @returns A Promise that fulfills when the request is complete
  * @example r.getSubmission('4e62ml').save()
  */
  async save() {
    return this._post({ uri: 'api/save', form: { id: this.name } }).then(() => this);
  }

  /**
  * Unsaves this item
  * @returns A Promise that fulfills when the request is complete
  * @example r.getSubmission('4e62ml').unsave()
  */
  async unsave() {
    return this._post({ uri: 'api/unsave', form: { id: this.name } }).then(() => this);
  }

  /**
  * Distinguishes this Comment or Submission with a sigil.
  * @desc **Note:** This function will only work if the requester is the author of this Comment/Submission.
  * @param options
  * @param options.status Determines how the item should be distinguished. `true` (default) signifies that the item should be moderator-distinguished, and `false` signifies that the item should not be distinguished. Passing a string (e.g. `admin`) will cause the item to get distinguished with that string, if possible.
  * @param options.sticky Determines whether this item should be stickied in addition to being distinguished. (This only applies to comments; to sticky a submission, use {@link Submission#sticky} instead.)
  * @returns A Promise that fulfills when the request is complete.
  * @example r.getComment('d1xclfo').distinguish({status: true, sticky: true})
  */
  async distinguish({ status = true, sticky = false }: { status?: boolean | string; sticky?: boolean; } = {}) {
    return this._post({
      uri: 'api/distinguish', form: {
        api_type: 'json',
        how: status === true ? 'yes' : status === false ? 'no' : status,
        sticky,
        id: this.name
      }
    }).then(() => this);
  }

  /**
  * Undistinguishes this Comment or Submission. Alias for distinguish({status: false})
  * @returns A Promise that fulfills when the request is complete.
  * @example r.getSubmission('4e62ml').undistinguish()
  */
  async undistinguish() {
    return this.distinguish({ status: false, sticky: false }).then(() => this);
  }

  /**
  * Edits this Comment or Submission.
  * @param updatedText The updated markdown text to use
  * @returns A Promise that fulfills when this request is complete.
  * @example r.getComment('coip909').edit('Blah blah blah this is new updated text')
  */
  async edit(updatedText: string) {
    return this._post({
      uri: 'api/editusertext',
      form: { api_type: 'json', text: updatedText, thing_id: this.name }
    }).then(pTap(handleJsonErrors(this)));
  }

  /**
  * Gives reddit gold to the author of this Comment or Submission.
  * @returns A Promise that fulfills with this Comment/Submission when this request is complete
  * @example r.getComment('coip909').gild()
  */
  async gild() {
    return this._post({ uri: `api/v1/gold/gild/${this.name}` }).then(() => this);
  }

  async _setInboxRepliesEnabled(state: boolean) {
    return this._post({ uri: 'api/sendreplies', form: { state, id: this.name } });
  }

  /**
  * Enables inbox replies on this Comment or Submission
  * @returns A Promise that fulfills with this content when the request is complete
  * @example r.getComment('coip909').enableInboxReplies()
  */
  async enableInboxReplies() {
    return this._setInboxRepliesEnabled(true).then(() => this);
  }

  /**
  * Disables inbox replies on this Comment or Submission
  * @returns A Promise that fulfills with this content when the request is complete
  * @example r.getComment('coip909').disableInboxReplies()
  */
  async disableInboxReplies() {
    return this._setInboxRepliesEnabled(false).then(() => this);
  }

  async _mutateAndExpandReplies({ limit, depth }: { limit: number; depth: number; }) {
    if (depth <= 0) {
      return Promise.resolve(this);
    }
    let replies = this._name === 'Submission' ? this.comments : (this as unknown as Comment).replies;
    return replies?.fetchMore({ amount: limit - replies.length })
      .then(pTap(newReplies => {
        replies = newReplies;
      }))
      .then(replies => replies.slice(0, limit))
      // @ts-expect-error
      .map(reply => reply._mutateAndExpandReplies({ limit, depth: depth - 1 }))
      .then(() => this);
  }

  /**
  * Expands the reply Listings on this Comment/Submission.
  * @desc This is useful in cases where one wants to enumerate all comments on a
  thread, even the ones that are initially hidden when viewing it (e.g. long comment chains).
  *
  * This function accepts two optional parameters `options.limit` and `options.depth`. `options.limit` sets an upper bound
  for the branching factor of the resulting replies tree, i.e. the number of comments that are fetched in reply to any given
  item. `options.depth` sets an upper bound for the depth of the resulting replies tree (where a depth of 0 signifies that no
  replies should be fetched at all).
  *
  * Note that regardless of the `limit` and `depth` parameters used, any reply that appeared in the original reply tree will
  appear in the expanded reply tree. In certain cases, the depth of the resulting tree may also be larger than `options.depth`,
  if the reddit API returns more of a comment tree than needed.
  *
  * These parameters should primarily be used to keep the request count low; if a precise limit and depth are needed, it is
  recommended to manually verify the comments in the tree afterwards.
  *
  * Both parameters default to `Infinity` if omitted, i.e. the resulting tree contains every single comment available. It should
  be noted that depending on the size and depth of the thread, fetching every single comment can use up a significant number
  of ratelimited requests. (To give an intuitive estimate, consider how many clicks would be needed to view all the
  comments on the thread using the HTML site.)
  * @param {object} [options={}]
  * @param {number} [options.limit=Infinity] An upper-bound for the branching factor of the resulting tree of replies
  * @param {number} [options.depth=Infinity] An upper-bound for the depth of the resulting tree of replies
  * @returns A Promise that fulfills with a new version of this object that has an expanded reply tree. The original
  object is not modified
  * @example r.getSubmission('4fuq26').expandReplies().then(console.log)
  * // => (a very large comment tree containing every viewable comment on this thread)
  */
  async expandReplies({ limit = Infinity, depth = Infinity }: { limit?: number; depth?: number; } = {}) {
    // @ts-expect-error
    return this._r._promiseWrap(this.fetch().then(result => {
      // @ts-expect-error
      return result._clone({ deep: true })._mutateAndExpandReplies({ limit, depth });
    }));
  }

  /**
  * Deletes this Comment or Submission
  * @returns A Promise that fulfills with this Comment/Submission when this request is complete
  * @example r.getComment('coip909').delete()
  */
  async delete() {
    return this._post({ uri: 'api/del', form: { id: this.name } }).then(() => this);
  }
}
