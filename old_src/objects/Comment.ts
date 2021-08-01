import { addEmptyRepliesListing, getEmptyRepliesListing } from '../helpers';
import { snoowrap } from '../snoowrap';
import { Listing } from './Listing';
import { emptyChildren as emptyMoreObject } from './More';
import { Subreddit } from './Subreddit';
import { VoteableContent } from './VoteableContent';

/**
* A class representing a reddit comment
* @example
*
* // Get a comment with the given ID
* r.getComment('c0hkuyq')
*
*/
export class Comment extends VoteableContent {
  public readonly _name: string = 'Comment';
  declare public subreddit: Subreddit;
  replies?: Listing<Comment>;
  link_id?: string;
  parent_id?: string;

  constructor(options: Record<string, unknown>, _r: snoowrap, _hasFetched: boolean) {
    super(options, _r, _hasFetched);
    if (_hasFetched) {
      /* If a comment is in a deep comment chain, reddit will send a single `more` object with name `t1__` in place of the
      comment's replies. This is the equivalent of seeing a 'Continue this thread' link on the HTML site, and it indicates that
      replies should be fetched by sending another request to view the deep comment alone, and parsing the replies from that. */
      if (this.replies instanceof Listing && !this.replies.length && this.replies?._more && this.replies._more.name === 't1__') {
        this.replies = getEmptyRepliesListing(this);
      } else if ((this.replies as unknown as '') === '') {
        /* If a comment has no replies, reddit returns an empty string as its `replies` property rather than an empty Listing.
        This behavior is unexpected, so replace the empty string with an empty Listing. */
        // @ts-expect-error
        this.replies = this._r._newObject<Listing<Comment>>('Listing', { children: [], _more: emptyMoreObject, _isCommentList: true });
      } else if (this.replies?._more && !this.replies._more.link_id) {
        this.replies._more.link_id = this.link_id;
      }
    }
  }

  _transformApiResponse(response: Comment[]) {
    return addEmptyRepliesListing(response[0]);
  }

  public get _uri() {
    return `api/info?id=${this.name}`;
  }

  /**
  * @summary Locks this Comment, preventing new comments from being posted on it.
  * @returns The updated version of this Comment
  * @example r.getComment('d1xclfo').lock()
  */
  async lock(): Promise<this> {
    return this._post<void>({ uri: 'api/lock', form: { id: this.name } }).then(() => this);
  }

  /**
  * @summary Unlocks this Comment, allowing comments to be posted on it again.
  * @returns The updated version of this Comment
  * @example r.getComment('d1xclfo').unlock()
  */
  async unlock(): Promise<this> {
    return this._post<void>({ uri: 'api/unlock', form: { id: this.name } }).then(() => this);
  }
};
