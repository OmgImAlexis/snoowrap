import { RedditContent } from './RedditContent';
import { Submission } from './Submission';
import { Subreddit } from './Subreddit';

/**
* A class representing a wiki page on a subreddit.
*
* **Note:** Due to a bug in reddit's CORS settings, it is not possible to fetch the contents of a wiki page on a private
subreddit while running snoowrap in a browser. (This issue does not apply when running snoowrap in Node.js.)
*
* @example
*
* // Get a wiki page on a given subreddit by name
* r.getSubreddit('AskReddit').getWikiPage('rules')
*/
export class WikiPage extends RedditContent {
  public readonly _name: string = 'WikiPage';
  public subreddit?: Subreddit;
  public title?: string;

  public get _uri () {
    return `r/${this.subreddit?.display_name}/wiki/${this.title}`;
  }

  /**
  * Gets the current settings for this wiki page.
  * @returns An Object representing the settings for this page
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPage('index').getSettings().then(console.log)
  * // => WikiPageSettings { permlevel: 0, editors: [], listed: true }
  */
  async getSettings () {
    return this._get({uri: `r/${this.subreddit?.display_name}/wiki/settings/${this.title}`});
  }

  /**
  * Edits the settings for this wiki page.
  * @param options
  * @param options.listed Determines whether this wiki page should appear on the public list of pages for this
  subreddit.
  * @param options.permissionLevel Determines who should be allowed to access and edit this page `0` indicates that
  this subreddit's default wiki settings should get used, `1` indicates that only approved wiki contributors on this subreddit
  should be able to edit this page, and `2` indicates that only mods should be able to view and edit this page.
  * @returns A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').editSettings({listed: false, permission_level: 1})
  */
  async editSettings ({listed, permissionLevel}: { listed: boolean; permissionLevel: number; }) {
    return this._post({
      uri: `r/${this.subreddit?.display_name}/wiki/settings/${this.title}`,
      form: {listed, permlevel: permissionLevel}
    }).then(() => this);
  }

  _modifyEditor ({name, action}: { name: string; action: string; }) {
    return this._post({
      uri: `r/${this.subreddit?.display_name}/api/wiki/alloweditor/${action}`,
      form: {page: this.title, username: name}
    });
  }

  /**
  * @summary Makes the given user an approved editor of this wiki page.
  * @param options
  * @param options.name The name of the user to be added
  * @returns A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').addEditor({name: 'actually_an_aardvark'})
  */
  async addEditor ({name}: { name: string }) {
    return this._modifyEditor({name, action: 'add'}).then(() => this);
  }

  /**
  * @summary Revokes this user's approved editor status for this wiki page
  * @param options
  * @param options.name The name of the user to be removed
  * @returns A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').removeEditor({name: 'actually_an_aardvark'})
  */
  async removeEditor ({name}: { name: string }) {
    return this._modifyEditor({name, action: 'del'}).then(() => this);
  }

  /**
  * @summary Edits this wiki page, or creates it if it does not exist yet.
  * @param options
  * @param options.text The new content of the page, in markdown.
  * @param options.reason The edit reason that will appear in this page's revision history. 256 characters max
  * @param options.previousRevision Determines which revision this edit should be added to. If this parameter is omitted, this edit is simply added to the most recent revision.
  * @returns A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').edit({text: 'Welcome', reason: 'Added a welcome message'})
  */
  async edit ({text, reason, previousRevision}: { text: string; reason?: string; previousRevision?: string}) {
    return this._post({
      uri: `r/${this.subreddit?.display_name}/api/wiki/edit`,
      form: {content: text, page: this.title, previous: previousRevision, reason}
    }).then(() => this);
  }

  /**
  * @summary Gets a list of revisions for this wiki page.
  * @param {object} [options] Options for the resulting Listing
  * @returns A Listing containing revisions of this page
  * @example
  *
  * r.getSubreddit('snoowrap').getRevisions({limit: 1}).then(console.log)
  * // => Listing [
  * //  {
  * //    timestamp: 1460973194,
  * //    reason: 'Added a welcome message',
  * //    author: RedditUser { name: 'not_an_aardvark', id: 'k83md', ... },
  * //    page: 'index',
  * //    id: '506370b4-0508-11e6-b550-0e69f29e0c4d'
  * //  }
  * // ]
  */
  async getRevisions (options: Record<string, unknown>) {
    return this._getListing({uri: `r/${this.subreddit?.display_name}/wiki/revisions/${this.title}`, qs: options});
  }

  /**
  * @summary Hides the given revision from this page's public revision history.
  * @param options
  * @param options.id The revision's id
  * @returns A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').hideRevision({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
  */
  async hideRevision ({id}: { id: string }) {
    return this._post({
      uri: `r/${this.subreddit?.display_name}/api/wiki/hide`,
      qs: {page: this.title, revision: id}
    }).then(() => this);
  }

  /**
  * @summary Reverts this wiki page to the given point.
  * @param options
  * @param options.id The id of the revision that this page should be reverted to
  * @returns A Promise that fulfills with this WikiPage when the request is complete
  * @example r.getSubreddit('snoowrap').getWikiPage('index').revert({id: '506370b4-0508-11e6-b550-0e69f29e0c4d'})
  */
  async revert ({id}: { id: string }) {
    return this._post({
      uri: `r/${this.subreddit?.display_name}/api/wiki/revert`,
      qs: {page: this.title, revision: id}
    }).then(() => this);
  }

  /**
  * @summary Gets a list of discussions about this wiki page.
  * @param options Options for the resulting Listing.
  * @returns A Listing containing discussions about this page.
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPage('index').getDiscussions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getDiscussions (options: Record<string, unknown>) {
    return this._getListing<Submission>({uri: `r/${this.subreddit?.display_name}/wiki/discussions/${this.title}`, qs: options});
  }
};
