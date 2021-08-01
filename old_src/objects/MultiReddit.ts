import { snoowrap } from '../snoowrap';
import { $TSFIXME } from '../ts-fix-me';
import { RedditContent } from './RedditContent';
import { RedditUser } from './RedditUser';
import { Subreddit } from './Subreddit';

/**
* A class representing a multireddit.
* @example
*
* // Get a multireddit belonging to a specific user
* r.getUser('multi-mod').getMultireddit('coding_languages')
*/
export class MultiReddit extends RedditContent {
  public readonly _name: string = 'MultiReddit';
  declare name: string;
  public path!: string;
  public curator!: RedditUser;
  subreddits: Subreddit[] = [];

  constructor (options: $TSFIXME, _r: snoowrap, _hasFetched: boolean) {
    super(options, _r, _hasFetched);
    if (_hasFetched) {
      this.curator = _r.getUser(this.path.split('/')[2]);
      this.subreddits = this.subreddits?.map(item => this._r._newObject<Subreddit>('Subreddit', (item as $TSFIXME).data || {display_name: item.name}));
    }
  }

  public get _uri () {
    return `api/multi${this._path}?expand_srs=true`;
  }

  get _path () {
    return `/user/${this.curator.name}/m/${this.name}`;
  }

  /**
  * Copies this multireddit to the requester's own account.
  * @param options
  * @param options.newName The new name for the copied multireddit
  * @returns A Promise for the newly-copied multireddit
  * @example r.getUser('multi-mod').getMultireddit('coding_languages').copy({newName: 'my_coding_languages_copy'})
  */
  async copy ({newName}: { newName: string }) {
    return this._r._getMyName().then(name => {
      return this._post({uri: 'api/multi/copy', form: {
        from: this._path,
        to: `/user/${name}/m/${newName}`,
        display_name: newName
      }});
    });
  }

  /**
  * Edits the properties of this multireddit.
  * **Note**: Any omitted properties here will simply retain their previous values.
  * @param {object} options
  * @param {string} [options.name] The name of the new multireddit. 50 characters max.
  * @param {string} [options.description] A description for the new multireddit, in markdown.
  * @param {string} [options.visibility] The multireddit's visibility setting. One of `private`, `public`, `hidden`.
  * @param {string} [options.icon_name] One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`, `cute animals`,
  `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`, `models pinup`,
  `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`, `travel`,
  `unusual stories`, `video`, `None`
  * @param {string} [options.key_color] A six-digit RGB hex color, preceded by '#'
  * @param {string} [options.weighting_scheme] One of 'classic', 'fresh'
  * @returns The updated version of this multireddit
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').edit({visibility: 'hidden'})
  */
  async edit ({
    name = '',
    description,
    iconName,
    keyColor,
    visibility,
    weightingScheme
  }: {
    name?: string;
    description?: string;
    iconName?: string;
    keyColor?: string;
    visibility?: string;
    weightingScheme?: 'classic' | 'fresh';
  }) {
    const display_name = name.length ? name : this.name;
    return this._put({uri: `api/multi${this._path}`, form: {model: JSON.stringify({
      description_md: description,
      display_name,
      icon_name: iconName,
      key_color: keyColor,
      visibility,
      weighting_scheme: weightingScheme
    })}});
  }

  /**
  * @summary Adds a subreddit to this multireddit.
  * @param sub The Subreddit object to add (or a string representing a subreddit name).
  * @returns A Promise that fulfills with this multireddit when the request is complete.
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').addSubreddit('cookies');
  */
  async addSubreddit (sub: Subreddit | string) {
    sub = typeof sub === 'string' ? sub : sub.display_name;
    return this._put<void>({uri: `api/multi${this._path}/r/${sub}`, form: {model: JSON.stringify({name: sub})}}).then(() => this);
  }

  /**
  * @summary Removes a subreddit from this multireddit.
  * @param sub The Subreddit object to remove (or a string representing a subreddit name).
  * @returns A Promise that fulfills with this multireddit when the request is complete.
  * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').removeSubreddit('cookies');
  */
  async removeSubreddit (sub: Subreddit | string) {
    return this._delete<void>({uri: `api/multi${this._path}/r/${typeof sub === 'string' ? sub : sub.display_name}`}).then(() => this);
  }

  /**
   * Deletes this multireddit.
   * @returns A Promise that fulfills when this request is complete.
   * @example r.getUser('not_an_aardvark').getMultireddit('cookie_languages').delete()
   */
  async delete() {
    return this._delete<void>({uri: `api/multi${this._path}`});
  }

  /* Note: The endpoints GET/PUT /api/multi/multipath/description and GET /api/multi/multipath/r/srname are intentionally not
  included, because they're redundant and the same thing can be achieved by simply using fetch() and edit(). */
};