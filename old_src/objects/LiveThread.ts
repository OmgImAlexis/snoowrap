import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { formatLivethreadPermissions, handleJsonErrors } from '../helpers';
import { snoowrap } from '../snoowrap';
import { $TSFIXME } from '../ts-fix-me';
import { Listing } from './Listing';
import { RedditContent } from './RedditContent';
import { RedditUser } from './RedditUser';
import { Submission } from './Submission';

/**
* A class representing a live reddit thread
* @example
*
* // Get a livethread with the given ID
* r.getLivethread('whrdxo8dg9n0')
* @desc For the most part, reddit distributes the content of live threads via websocket, rather than through the REST API.
As such, snoowrap assigns each fetched LiveThread object a `stream` property, which takes the form of an
[EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). To listen for new thread updates, simply
add listeners to that emitter.

The following events can be emitted:
- `update`: Occurs when a new update has been posted in this thread. Emits a `LiveUpdate` object containing information
about the new update.
- `activity`: Occurs periodically when the viewer count for this thread changes.
- `settings`: Occurs when the thread's settings change. Emits an object containing the new settings.
- `delete`: Occurs when an update has been deleted. Emits the ID of the deleted update.
- `strike`: Occurs when an update has been striken (marked incorrect and crossed out). Emits the ID of the striken update.
- `embeds_ready`: Occurs when embedded media is now available for a previously-posted update.
- `complete`: Occurs when this LiveThread has been marked as complete, and no more updates will be sent.

(Note: These event types are mapped directly from reddit's categorization of the updates. The descriptions above are
paraphrased from reddit's descriptions [here](https://www.reddit.com/dev/api#section_live).)

As an example, this would log all new livethread updates to the console:

```javascript
someLivethread.stream.on('update', data => {
  console.log(data.body);
});
```
*/
export class LiveThread extends RedditContent {
  public readonly _name: string = 'LiveThread';
  private _rawStream: WebSocket | null;
  private _populatedStream: EventEmitter | null;
  public _hasFetched: boolean;
  websocket_url!: string;
  id!: string;

  constructor(options: $TSFIXME, _r: snoowrap, hasFetched: boolean) {
    super(options, _r, hasFetched);
    this._rawStream = null;
    this._populatedStream = null;
    this._hasFetched = hasFetched;
  }

  public get stream () {
    if (this._hasFetched) {
      if (!this._populatedStream && this.websocket_url) {
        this._setupWebSocket();
      }
      return this._populatedStream;
    }
  }

  public get _uri() {
    return `live/${this.id}/about`;
  }

  _setupWebSocket() {
    this._rawStream = new WebSocket(this.websocket_url);
    this._populatedStream = new EventEmitter();
    const handler = (data: $TSFIXME) => {
      const parsed = this._r._populate(JSON.parse(data));
      this._populatedStream?.emit(parsed.type, parsed.payload);
    };
    if (typeof this._rawStream.on === 'function') {
      this._rawStream.on('message', handler);
    } else {
      this._rawStream.onmessage = messageEvent => handler(messageEvent.data);
    }
  }

  /**
  * Adds a new update to this thread.
  * @param body The body of the new update
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').addUpdate('Breaking: Someone is reading the snoowrap documentation \\o/')
  */
  async addUpdate(body: string) {
    return this._post<{ json: { errors: string[]; } }>({ uri: `api/live/${this.id}/update`, form: { api_type: 'json', body } }).then(handleJsonErrors(this));
  }

  /**
  * Strikes (marks incorrect and crosses out) the given update.
  * @param options
  * @param options.id The ID of the update that should be striked.
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').strikeUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
  */
  async strikeUpdate({ id }: { id: string }) {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `api/live/${this.id}/strike_update`,
      form: { api_type: 'json', id: `${id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_'}${id}` }
    }).then(handleJsonErrors(this));
  }

  /**
  * Deletes an update from this LiveThread.
  * @param options
  * @param options.id The ID of the LiveUpdate that should be deleted
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').deleteUpdate({id: 'LiveUpdate_edc34446-faf0-11e5-a1b4-0e858bca33cd'})
  */
  async deleteUpdate({ id }: { id: string }) {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `api/live/${this.id}/delete_update`,
      form: { api_type: 'json', id: `${id.startsWith('LiveUpdate_') ? '' : 'LiveUpdate_'}${id}` }
    }).then(handleJsonErrors(this));
  }

  /**
  * Gets a list of this LiveThread's contributors
  * @returns An Array containing RedditUsers
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getContributors().then(console.log)
  * // => [
  * //  RedditUser { permissions: ['edit'], name: 'not_an_aardvark', id: 't2_k83md' },
  * //  RedditUser { permissions: ['all'], id: 't2_u3l80', name: 'snoowrap_testing' }
  * // ]
  */
  async getContributors() {
    return this._get<RedditUser[]>({ uri: `live/${this.id}/contributors` }).then(contributors => {
      return Array.isArray(contributors[0]) ? contributors[0] : contributors;
    });
  }

  /**
  * Invites a contributor to this LiveThread.
  * @param options
  * @param options.name The name of the user who should be invited
  * @param options.permissions The permissions that the invited user should receive. This should be an Array containing
  some combination of `'update', 'edit', 'manage'`. To invite a contributor with full permissions, omit this property.
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').inviteContributor({name: 'actually_an_aardvark', permissions: ['update']})
  */
  async inviteContributor({ name, permissions }: { name: string; permissions: ('update' | 'edit' | 'manage')[] }) {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `api/live/${this.id}/invite_contributor`, form: {
        api_type: 'json',
        name,
        permissions: formatLivethreadPermissions(permissions),
        type: 'liveupdate_contributor_invite'
      }
    }).then(handleJsonErrors(this));
  }

  /**
  * Revokes an invitation for the given user to become a contributor on this LiveThread.
  * @param {object} options
  * @param {string} options.name The username of the account whose invitation should be revoked
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').revokeContributorInvite({name: 'actually_an_aardvark'});
  */
  async revokeContributorInvite({ name }: { name: string }) {
    return this._r.getUser(name).fetch<RedditUser>().then(user => user.id).then(userId => {
      return this._post<{ json: { errors: string[]; } }>({ uri: `api/live/${this.id}/rm_contributor_invite`, form: { api_type: 'json', id: `t2_${userId}` } });
    }).then(handleJsonErrors(this));
  }

  /**
  * Accepts a pending contributor invitation on this LiveThread.
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').acceptContributorInvite()
  */
  async acceptContributorInvite(): Promise<this> {
    return this._post({ uri: `api/live/${this.id}/accept_contributor_invite`, form: { api_type: 'json' } }).then(() => this);
  }

  /**
  * Abdicates contributor status on this LiveThread.
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').leaveContributor()
  */
  async leaveContributor(): Promise<this> {
    return this._post({ uri: `api/live/${this.id}/leave_contributor`, form: { api_type: 'json' } }).then(() => this);
  }

  /**
  * Removes the given user from contributor status on this LiveThread.
  * @param options
  * @param options.name The username of the account who should be removed
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').removeContributor({name: 'actually_an_aardvark'})
  */
  async removeContributor({ name }: { name: string }): Promise<this> {
    return this._r.getUser(name).fetch<RedditUser>().then(user => user.id).then(userId => {
      return this._post<{ json: { errors: string[]; } }>({ uri: `api/live/${this.id}/rm_contributor`, form: { api_type: 'json', id: `t2_${userId}` } });
    }).then(handleJsonErrors(this));
  }

  /**
  * Sets the permissions of the given contributor.
  * @param options
  * @param options.name The name of the user whose permissions should be changed
  * @param options.permissions The updated permissions that the user should have. This should be an Array containing
  some combination of `'update', 'edit', 'manage'`. To give the contributor with full permissions, omit this property.
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').setContributorPermissions({name: 'actually_an_aardvark', permissions: ['edit']})
  */
  async setContributorPermissions({ name, permissions }: { name: string; permissions: ('update' | 'edit' | 'manage')[] }): Promise<this> {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `api/live/${this.id}/set_contributor_permissions`,
      form: { api_type: 'json', name, permissions: formatLivethreadPermissions(permissions), type: 'liveupdate_contributor' }
    }).then(handleJsonErrors(this));
  }

  /**
  * Edits the settings on this LiveThread.
  * @param options
  * @param options.title The title of the thread
  * @param options.description A descriptions of the thread. 120 characters max
  * @param options.resources Information and useful links related to the thread.
  * @param options.nsfw Determines whether the thread is Not Safe For Work
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').editSettings({title: 'My livethread', description: 'an updated description'})
  */
  async editSettings({ title, description, resources, nsfw }: { title: string; description?: string; resources?: string; nsfw: boolean; }): Promise<this> {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `api/live/${this.id}/edit`,
      form: { api_type: 'json', description, nsfw, resources, title }
    }).then(handleJsonErrors(this));
  }

  /**
  * Permanently closes this thread, preventing any more updates from being added.
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').closeThread()
  */
  async closeThread(): Promise<this> {
    return this._post<void>({ uri: `api/live/${this.id}/close_thread`, form: { api_type: 'json' } }).then(() => this);
  }

  /**
  * Reports this LiveThread for breaking reddit's rules.
  * @param {object} options
  * @param {string} options.reason The reason for the report. One of `spam`, `vote-manipulation`, `personal-information`,
  `sexualizing-minors`, `site-breaking`
  * @returns A Promise that fulfills with this LiveThread when the request is complete
  * @example r.getLivethread('whrdxo8dg9n0').report({reason: 'Breaking a rule blah blah blah'})
  */
  async report({ reason }: { reason: 'spam' | 'vote-manipulation' | 'personal-information' | 'sexualizing-minors' | 'site-breaking' }): Promise<this> {
    return this._post<{ json: { errors: string[]; } }>({ uri: `api/live/${this.id}/report`, form: { api_type: 'json', type: reason } }).then(handleJsonErrors(this));
  }

  /**
  * Gets a Listing containing past updates to this LiveThread.
  * @param options Options for the resulting Listing
  * @returns A Listing containing LiveUpdates
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getRecentUpdates().then(console.log)
  * // => Listing [
  * //  LiveUpdate { ... },
  * //  LiveUpdate { ... },
  * //  ...
  * // ]
  */
  async getRecentUpdates(options: Record<string, unknown>) {
    return this._getListing<Submission>({ uri: `live/${this.id}`, qs: options });
  }

  /**
  * Gets a list of reddit submissions linking to this LiveThread.
  * @param {object} [options] Options for the resulting Listing
  * @returns A Listing containing Submissions
  * @example
  *
  * r.getLivethread('whrdxo8dg9n0').getDiscussions().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getDiscussions(options: Record<string, unknown>): Promise<Listing<Submission>> {
    return this._getListing<Submission>({ uri: `live/${this.id}/discussions`, qs: options });
  }

  /**
  * Stops listening for new updates on this LiveThread.
  * To avoid memory leaks that can result from open sockets, it's recommended that you call this method when you're
  finished listening for updates on this LiveThread.
  *
  * This should not be confused with {@link LiveThread#closeThread}, which marks the thread as "closed" on reddit.
  * @returns undefined
  * @example
  *
  * var myThread = r.getLivethread('whrdxo8dg9n0');
  * myThread.stream.on('update', content => {
  *   console.log(content);
  *   myThread.closeStream();
  * })
  *
  */
  closeStream() {
    if (this._rawStream) {
      this._rawStream?.close();
    }
  }
};
