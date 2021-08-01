import { clone, defaults, defaultsDeep, isEmpty, omitBy, pick } from 'lodash';
import { parse as urlParse } from 'url';
import { InvalidMethodCallError } from '../errors';
import { More, emptyChildren } from './More';
import { snoowrap } from '../snoowrap';
import { oauthRequest } from '../request_handler';
import { $TSFIXME } from '../ts-fix-me';

const INTERNAL_DEFAULTS = {
  _query: {},
  _transform: value => value,
  _method: 'get',
  _isCommentList: false,
  _link_id: null,
  _uri: null,
  _more: null,
  _cachedLookahead: null
};

/**
* A class representing a list of content. This is a subclass of the native Array object, so it has all the properties of
an Array (length, forEach, etc.) in addition to some added methods. The Listing can be extended by using the
[#fetchMore()]{@link Listing#fetchMore} and
[#fetchAll()]{@link Listing#fetchAll} functions. Note that these methods return new Listings, rather than mutating the
original Listing.
*
* Most methods that return Listings will also accept `limit`, `after`, `before`, `show`, and `count` properties.
*
* If you've used the reddit API before (or used other API wrappers like [PRAW](https://praw.readthedocs.org/en/stable/)), you
might know that reddit uses a `MoreComments` object in its raw JSON responses, representing comments that have been stubbed
out of Listings. In snoowrap, there are no exposed `MoreComments` objects; the objects returned by the reddit API are
stripped from Listings and are used internally as sources for the `fetchMore` functions. This means that in snoowrap, Listings
that contain Comments can be used/expanded in the same manner as Listings that don't contain Comments, and for the most part
you don't have to worry about the distinction.

(Incidentally, if you encounter a Listing that *does* contain a `MoreComments` object then it's a bug, so please report it.)

* @extends Array
*/
export class Listing<T> extends Array<T> {
  public readonly _name: string = 'Listing';
  public name!: string;
  private _r: snoowrap;
  private _cachedLookahead: $TSFIXME;
  private _query: $TSFIXME;
  private _isCommentList?: boolean;
  _more!: Listing<unknown>;
  public _uri?: string;
  private _method?: 'get' | 'post' | 'delete' | 'put' | 'patch';
  private _transform: $TSFIXME;
  link_id?: string;
  children?: $TSFIXME[];

  constructor(options: { children?: $TSFIXME[]; _cachedLookahead?: $TSFIXME; } = {}, _r: snoowrap) {
    super();
    this.push(...options.children || []);
    this._r = _r;
    this._cachedLookahead = options._cachedLookahead;
    defaultsDeep(this, pick(options, Object.keys(INTERNAL_DEFAULTS)), INTERNAL_DEFAULTS);
    Object.assign(this._query, pick(options, ['before', 'after']));
    if (options.children && options.children[options.children.length - 1] instanceof More) {
      const more = this.pop();
      // @ts-expect-error
      if (more) this._setMore<T>(more);
    }
  }

  _setUri(value: string) {
    const parsedUri = urlParse(value, true);
    // @ts-expect-error
    this._uri = parsedUri.pathname;
    defaultsDeep(this._query, parsedUri.query);
    if (parsedUri.query.before) {
      this._query.after = null;
    } else {
      this._query.before = null;
    }
  }

  /**
  * @summary A getter that indicates whether this Listing has any more items to fetch.
  */
  get isFinished(): boolean {
    // The process of checking whether a Listing is 'finished' varies depending on what kind of Listing it is.
    return this._isCommentList
      /* For comment Listings (i.e. Listings containing comments and comment replies, sourced by `more` objects): A Listing is
      *never* finished if it has a cached lookahead (i.e. extra items that were fetched from a previous request). If there is
      no cached lookahead, a Listing is finished if it has an empty `more` object. */
      ? isEmpty(this._cachedLookahead) && !!this._more && isEmpty(this._more.children)
      /* For non-comment Listings: A Listing is always finished if it has no URI (since there would be nowhere to fetch items
      from). If it has a URI, a Listing is finished if its `before` and `after` query are both `null`. This is because reddit
      returns a value of `null` as the `after` and `before` parameters to signify that a Listing is complete.

      It is important to check for `null` here rather than any falsey value, because when an empty Listing is initialized, its
      `after` and `before` properties are both `undefined`, but calling these empty Listings `finished` would be incorrect. */
      : !this._uri || (this._query.after === null && this._query.before === null);
  }

  /**
  * @summary Fetches some more items
  * @param {object} options
  * @param {number} options.amount The number of items to fetch.
  * @param {boolean} [options.skipReplies=false] For a Listing that contains comment objects on a Submission, this option can
  be used to save a few API calls, provided that only top-level comments are being examined. If this is set to `true`, snoowrap
  is able to fetch 100 Comments per API call rather than 20, but all returned Comments will have no fetched replies by default.
  *
  * Internal details: When `skipReplies` is set to `true`, snoowrap uses reddit's `api/info` endpoint to fetch Comments. When
  `skipReplies` is set to `false`, snoowrap uses reddit's `api/morechildren` endpoint. It's worth noting that reddit does
  not allow concurrent requests to the `api/morechildren` endpoint by the same account.
  * @param {boolean} [options.append=true] If `true`, the resulting Listing will contain the existing elements in addition to
  the newly-fetched elements. If `false`, the resulting Listing will only contain the newly-fetched elements.
  * @returns A new Listing containing the newly-fetched elements. If `options.append` is `true`, the new Listing will
  also contain all elements that were in the original Listing. Under most circumstances, the newly-fetched elements will appear
  at the end of the new Listing. However, if reverse pagination is enabled (i.e. if this Listing was created with a `before`
  query parameter), then the newly-fetched elements will appear at the beginning. In any case, continuity is maintained, i.e.
  the order of items in the Listing will be the same as the order in which they appear on reddit.
  * @example
  * r.getHot({limit: 25}).then(myListing => {
  *   console.log(myListing.length); // => 25
  *   myListing.fetchMore({amount: 10}).then(extendedListing => {
  *     console.log(extendedListing.length); // => 35
  *   })
  * });
  */
  async fetchMore(options: { amount: number; skipReplies?: boolean; append?: boolean; }): Promise<$TSFIXME> {
    const parsedOptions = defaults(
      typeof options === 'number' ? { amount: options } : clone(options),
      { append: true, skipReplies: options.skipReplies }
    );
    if (typeof parsedOptions.amount !== 'number' || Number.isNaN(parsedOptions.amount)) {
      throw new InvalidMethodCallError('Failed to fetch Listing. (`amount` parameter was missing or invalid)');
    }
    if (parsedOptions.amount <= 0 || this.isFinished) {
      // @ts-expect-error
      return this._r._promiseWrap(Promise.resolve(parsedOptions.append ? this._clone() : this._clone()._empty()));
    }
    if (this._cachedLookahead) {
      const cloned = this._clone();
      cloned.push(...cloned._cachedLookahead.splice(0, parsedOptions.amount));
      // @ts-expect-error
      return cloned.fetchMore(parsedOptions.amount - cloned.length + this.length);
    }
    return this._r._promiseWrap(
      this._more ? this._fetchMoreComments(parsedOptions) : this._fetchMoreRegular(parsedOptions)
    );
  }

  _fetchMoreRegular(options: { amount: number; append: boolean; }) {
    const query = omitBy(clone(this._query), value => value === null || value === undefined);
    if (!this._isCommentList) {
      /* Reddit returns a different number of items per request depending on the `limit` querystring property specified in the
      request. If no `limit` property is specified, reddit returns some number of items depending on the user's preferences
      (currently 25 items with default preferences). If a `limit` property is specified, then reddit returns `limit` items per
      batch. However, this is capped at 100, so if a `limit` larger than 100 items is specified, reddit will only return 100
      items in the batch. (The cap of 100 could plausibly change to a different amount in the future.)

      However, one caveat is that reddit's parser doesn't understand the javascript `Infinity` global. If `limit=Infinity` is
      provided in the querystring, reddit won't understand the parameter so it'll just act as if no parameter was provided, and
      will return 25 items in the batch. This is suboptimal behavior as far as snoowrap is concerned, because it means that 4
      times as many requests are needed to fetch the entire listing.

      To get around the issue, snoowrap caps the `limit` property at Number.MAX_SAFE_INTEGER when sending requests. This ensures
      that `Infinity` will never be sent as part of the querystring, so reddit will always return the maximal 100 items per
      request if the desired amount of items is large. */
      query.limit = Math.min(options.amount, Number.MAX_SAFE_INTEGER);
    }
    // @ts-expect-error
    return oauthRequest({
      uri: this._uri,
      qs: query,
      method: this._method!
    }).then(this._transform).then(response => {
      const cloned = this._clone();
      if (!options.append) {
        cloned._empty();
      }
      if (cloned._query.before) {
        cloned.unshift(...response);
        cloned._query.before = response._query.before;
        cloned._query.after = null;
      } else {
        cloned.push(...response);
        cloned._query.before = null;
        cloned._query.after = response._query.after;
      }
      if (this._isCommentList) {
        cloned._more = cloned._more || response._more || emptyChildren;
        if (response.length > options.amount) {
          cloned._cachedLookahead = Array.from(cloned.splice(options.amount));
        }
      }
      return cloned.fetchMore({ ...options, append: true, amount: options.amount - response.length });
    });
  }

  /* Pagination for comments works differently than it does for most other things; rather than sending a link to the next page
  within a Listing, reddit sends the last comment in the list as as a `more` object, with links to all the remaining comments
  in the thread. */
  async _fetchMoreComments(options: { amount: number; append?: boolean; }) {
    return this._more?.fetchMore(options).then(moreComments => {
      const cloned = this._clone();
      if (!options.append) {
        cloned._empty();
      }
      cloned.push(...moreComments);
      cloned._more.children = cloned._more.children?.slice(options.amount);
      return cloned;
    });
  }

  /**
  * @summary Fetches all of the items in this Listing, only stopping when there are none left.
  * @param {object} [options] Fetching options -- see {@link Listing#fetchMore}
  * @returns A new fully-fetched Listing. Keep in mind that this method has the potential to exhaust your
  ratelimit quickly if the Listing doesn't have a clear end (e.g. with posts on the front page), so use it with discretion.
  * @example
  *
  * r.getMe().getUpvotedContent().fetchAll().then(console.log)
  * // => Listing [ Submission { ... }, Submission { ... }, ... ]
  */
  async fetchAll(options: $TSFIXME) {
    return this.fetchMore({ ...options, amount: Infinity });
  }

  _clone({ deep = false }: { deep?: boolean; } = {}) {
    const properties = pick(this, Object.keys(INTERNAL_DEFAULTS));
    // @ts-expect-error
    properties._query = clone(properties._query);
    // @ts-expect-error
    properties._cachedLookahead = clone(properties._cachedLookahead);
    properties._more = this._more && this._more._clone();
    const shallowChildren = Array.from(this);
    properties.children = deep
      // @ts-expect-error
      ? shallowChildren.map(item => '_clone' in item && typeof item._clone === 'function' ? item._clone({ deep }) : item)
      : shallowChildren;
    return new Listing(properties, this._r);
  }

  _setMore<T extends Listing<T>>(moreObj: T) {
    this._more = moreObj;
    this._isCommentList = true;
  }

  _empty() {
    this.splice(0, this.length);
    return this;
  }

  toJSON() {
    // @ts-expect-error
    return Array.from(this).map(item => item && item.toJSON ? item.toJSON() : item);
  }
};

