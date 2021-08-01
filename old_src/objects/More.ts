import {concat, flatten, pick} from 'lodash';
import {addEmptyRepliesListing, buildRepliesTree, handleJsonErrors} from '../helpers';
import {MAX_API_INFO_AMOUNT, MAX_API_MORECHILDREN_AMOUNT} from '../constants';
import { $TSFIXME } from '../ts-fix-me';
import { snoowrap } from '../snoowrap';
import pTap from 'p-tap';
import pMapSeries from 'p-map-series';
import { Comment } from './Comment';
import { PrivateMessage } from './PrivateMessage';

/**
* The `More` class is a helper representing reddit's exposed `more` type in comment threads, used to fetch additional comments
on a thread.
* No instances of the `More` class are exposed externally by snoowrap; instead, comment lists are exposed as Listings.
Additional replies on an item can be fetched by calling `fetchMore` on a Listing, in the same manner as what would be done
with a Listing of posts. snoowrap should handle the differences internally, and expose a nearly-identical interface for the
two use-cases.

Combining reddit's `Listing` and `more` objects has the advantage of having a more consistent exposed interface; for example,
if a consumer iterates over the comments on a Submission, all of the iterated items will actually be Comment objects, so the
consumer won't encounter an unexpected `more` object at the end. However, there are a few disadvantages, namely that (a) this
leads to an increase in internal complexity, and (b) there are a few cases where reddit's `more` objects have different amounts
of available information (e.g. all the child IDs of a `more` object are known on creation), which leads to different optimal
behavior.
*/

export class More {
  public readonly _name: string = 'More';
  private _r?: snoowrap;
  children!: string[];
  parent_id?: string;
  link_id?: string;
  depth?: number;
  id?: string;
  count?: number;

  constructor (options: $TSFIXME, _r?: snoowrap) {
    Object.assign(this, options);
    this._r = _r;
  }
  /* Requests to /api/morechildren are capped at 20 comments at a time, but requests to /api/info are capped at 100, so
  it's easier to send to the latter. The disadvantage is that comment replies are not automatically sent from requests
  to /api/info. */
  async fetchMore(options: { amount: number; skipReplies?: boolean; }, startIndex = 0): Promise<[]> {
    if (options.amount <= 0 || startIndex >= this.children.length) {
      return Promise.resolve([]);
    }
    if (!options.skipReplies) {
      // @ts-expect-error
      return this.fetchTree(options, startIndex);
    }
    const ids = getNextIdSlice(this.children, startIndex, options.amount, MAX_API_INFO_AMOUNT).map((id: $TSFIXME) => `t1_${id}`);
    // Requests are capped at 100 comments. Send lots of requests recursively to get the comments, then concatenate them.
    // (This speed-requesting is only possible with comment Listings since the entire list of ids is present initially.)
    const promiseForThisBatch = this._r?._getListing({uri: 'api/info', qs: {id: ids.join(',')}});
    const nextRequestOptions = {...options, amount: options.amount - ids.length};
    const promiseForRemainingItems = this.fetchMore(nextRequestOptions, startIndex + ids.length);
    // @ts-expect-error
    return Promise.all([promiseForThisBatch, promiseForRemainingItems]).then(flatten);
  }

  fetchTree (options: { amount: number; }, startIndex: number) {
    if (options.amount <= 0 || startIndex >= this.children.length) {
      return Promise.resolve([]);
    }
    const ids = getNextIdSlice(this.children, startIndex, options.amount, MAX_API_MORECHILDREN_AMOUNT);
    return this._r?._get<{ json: { data: { things: (Comment | PrivateMessage)[] } } }>({
      uri: 'api/morechildren',
      qs: {api_type: 'json', children: ids.join(','), link_id: this.link_id || this.parent_id}
    }).then(pTap(handleJsonErrors))
      .then(res => res.json.data.things)
      .then(res => res.map(item => addEmptyRepliesListing(item)))
      .then(buildRepliesTree)
      .then(resultTrees => {
        /* Sometimes, when sending a request to reddit to get multiple comments from a `more` object, reddit decides to only
        send some of the requested comments, and then stub out the remaining ones in a smaller `more` object. ( ¯\_(ツ)_/¯ )
        In these cases, recursively fetch the smaller `more` objects as well. */
        const childMores = resultTrees.filter(c => c instanceof More).map(c => ({
          ...c,
          link_id: this.link_id || this.parent_id
        }));
        return pMapSeries(childMores, c => c.fetchTree({...options, amount: Infinity}, 0)).then(expandedTrees => {
          return this.fetchMore({...options, amount: options.amount - ids.length}, startIndex + ids.length).then((nexts: $TSFIXME) => {
            return concat(resultTrees, flatten(expandedTrees), nexts);
          });
        });
      });
  }

  _clone () {
    return new More(pick(this, Object.getOwnPropertyNames(this)), this._r);
  }
};

function getNextIdSlice (children: $TSFIXME[], startIndex: number, desiredAmount: number, limit: number) {
  return children.slice(startIndex, startIndex + Math.min(desiredAmount, limit));
}

export const emptyChildren = new More({children: []});
