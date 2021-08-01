import { cloneDeep, mapValues, pick } from 'lodash';
import { USER_KEYS, SUBREDDIT_KEYS } from '../constants';
import { Listing } from './Listing';
import { Snoowrap } from '../snoowrap';
import { $TSFIXME } from '../ts-fix-me';
import { oauthRequest } from '../request_handler';

/**
* A base class for content from reddit. With the exception of Listings, all content types extend this class.
* This class should be considered 'abstract', to the extend that JavaScript classes can be -- it should not be necessary to
* instantiate it directly.
*/
export class RedditContent {
  public readonly _name: string = 'RedditContent';
  public name?: string;

  _r: Snoowrap;
  private _fetch?: $TSFIXME;
  public _hasFetched: boolean;

  constructor (data: { name?: string; }, _r: Snoowrap, hasFetched: boolean) {
    // _r refers to the snoowrap requester that is used to fetch this content.
    this._r = _r;
    this._fetch = null;
    this._hasFetched = hasFetched;
    this.name = data.name;
  }

  /**
  * Fetches this content from reddit.
  * @desc This will not mutate the original content object; all Promise properties will remain as Promises after the content has
  * been fetched. However, the information on this object will be cached, so it may become out-of-date with the content on
  * reddit. To clear the cache and fetch this object from reddit again, use `refresh()`.
  *
  * If snoowrap is running in an environment that supports ES2015 Proxies (e.g. Chrome 49+), then `fetch()` will get
  * automatically called when an unknown property is accessed on an unfetched content object.
  * @returns A version of this object with all of its fetched properties from reddit. This will not mutate the
  object. Once an object has been fetched once, its properties will be cached, so they might end up out-of-date if this
  function is called again. To refresh an object, use refresh().
  * @example
  *
  * r.getUser('not_an_aardvark').fetch().then(userInfo => {
  *   console.log(userInfo.name); // 'not_an_aardvark'
  *   console.log(userInfo.created_utc); // 1419104352
  * });
  *
  * r.getComment('d1xchqn').fetch().then(comment => comment.body).then(console.log)
  * // => 'This is a little too interesting for my liking'
  */
  fetch<Fetched = any>(): Promise<Fetched> {
    return this._r._get({ uri: (this as any)._uri }).then(res => this._transformApiResponse(res)) as Promise<Omit<this, keyof Fetched> & Fetched>;
  }

  /**
  * Refreshes this content.
  * @returns A newly-fetched version of this content
  * @example
  *
  * var someComment = r.getComment('cmfkyus');
  * var initialCommentBody = some_comment.fetch().then(comment => comment.body);
  *
  * setTimeout(() => {
  *   someComment.refresh().then(refreshedComment => {
  *     if (initialCommentBody.value() !== refreshedComment.body) {
  *       console.log('This comment has changed since 10 seconds ago.');
  *     }
  *   });
  * }, 10000);
  */
  async refresh<Fetched = any>() {
    this._fetch = null;
    return this.fetch<Fetched>();
  }

  /**
  * Returns a stringifyable version of this object.
  * @desc It is usually not necessary to call this method directly; simply running JSON.stringify(some_object) will strip the private properties anyway.
  * @returns A version of this object with all the private properties stripped.
  * @example
  *
  * var user = r.getUser('not_an_aardvark');
  * JSON.stringify(user) // => '{"name":"not_an_aardvark"}'
  */
  toJSON () {
    return mapValues(this._stripPrivateProps(), (value, key) => {
      if (value instanceof RedditContent && !value._hasFetched) {
        if (value._name === 'RedditUser' && USER_KEYS.has(key)) {
          return value.name;
        }
        if (value._name === 'Subreddit' && SUBREDDIT_KEYS.has(key)) {
          // @ts-expect-error
          return value.display_name;
        }
      }
      // @ts-expect-error
      return value && value.toJSON ? value.toJSON() : value;
    });
  }

  _stripPrivateProps () {
    return pick(this, Object.keys(this).filter(key => !key.startsWith('_')));
  }

  _transformApiResponse (response: $TSFIXME) {
    return response;
  }

  _clone({deep = false} = {}) {
    const clonedProps = mapValues(this, value => {
      if (deep) {
        return value instanceof RedditContent || value instanceof Listing ? value._clone({deep}) : cloneDeep(value);
      }
      return value;
    });
    // @ts-expect-error
    return this._r._newObject(this.constructor._name, clonedProps, this._hasFetched);
  }

  _getListing<T>(...args: Parameters<Snoowrap['_getListing']>) {
    return this._r._getListing<T>(...args);
  }

  /**
   * @private
   */
  async _get<T extends unknown>(...options: $TSFIXME) {
    return this._r._get<T>(oauthRequest.bind(this)(options));
  }

  /**
   * @private
   */
  async _post<T extends unknown>(...options: $TSFIXME) {
    return this._r._post<T>(oauthRequest.bind(this)(options));
  }

  /**
   * @private
   */
   async _put<T extends unknown>(...options: $TSFIXME) {
    return this._r._put<T>(oauthRequest.bind(this)(options));
  }

  /**
   * @private
   */
   async _delete<T extends unknown>(...options: $TSFIXME) {
    return this._r._delete<T>(oauthRequest.bind(this)(options));
  }
}
