import pMap from 'p-map';
import pTap from 'p-tap';
import { chunk, flatten, omit } from 'lodash';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { formatModPermissions, handleJsonErrors, hasFullnamePrefix, renameKey } from '../helpers';
import { InvalidMethodCallError } from '../errors';
import { RedditContent } from './RedditContent';
import { $TSFIXME } from '../ts-fix-me';
import { WikiPage } from './WikiPage';
import { Submission } from './Submission';
import { RedditUser } from './RedditUser';
import { Listing } from './Listing';
import { CommentSort, ModLogAction, SpamLevels, SubredditType } from '../types';
import { Snoowrap } from '../snoowrap';
import { FetchedSubmission } from '../types/fetched-submission';

/**
* A class representing a subreddit
* @example
*
* // Get a subreddit by name
* r.getSubreddit('AskReddit')
*/
export class Subreddit extends RedditContent {
  public readonly _name: string = 'Subreddit';
  public displayName: string;

  constructor(data: { name?: string; displayName: string; }, _r: Snoowrap, hasFetched: boolean) {
    super(data, _r, hasFetched);

    this.displayName = data.displayName;
  }

  public get _uri() {
    return `r/${this.displayName}/about`;
  }

  _transformApiResponse(response: $TSFIXME) {
    if (!(response instanceof Subreddit)) {
      throw new TypeError(`The subreddit /r/${this.displayName} does not exist.`);
    }
    return response;
  }

  async _deleteFlairTemplates({ flair_type }: { flair_type: 'USER_FLAIR' | 'LINK_FLAIR' }) {
    return this._post({ uri: `r/${this.displayName}/api/clearflairtemplates`, form: { api_type: 'json', flair_type } }).then(() => this);
  }

  /**
  * Deletes all of this subreddit's user flair templates
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteAllUserFlairTemplates()
  */
  async deleteAllUserFlairTemplates() {
    return this._deleteFlairTemplates({ flair_type: 'USER_FLAIR' });
  }

  /**
  * Deletes all of this subreddit's link flair templates
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteAllLinkFlairTemplates()
  */
  async deleteAllLinkFlairTemplates() {
    return this._deleteFlairTemplates({ flair_type: 'LINK_FLAIR' });
  }

  /**
  * Deletes one of this subreddit's flair templates.
  * @param options
  * @param options.flair_template_id The ID of the template that should be deleted.
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').deleteFlairTemplate({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
  */
  async deleteFlairTemplate({ flair_template_id }: { flair_template_id: string }) {
    return this._post({
      uri: `r/${this.displayName}/api/deleteflairtemplate`,
      form: { api_type: 'json', flair_template_id }
    }).then(() => this);
  }

  async _createFlairTemplate({
    text, cssClass, flairType, textEditable = false
  }: $TSFIXME) {
    return this._post({
      uri: `r/${this.displayName}/api/flairtemplate`,
      form: { api_type: 'json', text, css_class: cssClass, flair_type: flairType, text_editable: textEditable }
    }).then(() => this);
  }

  /**
  * Creates a new user flair template for this subreddit.
  * @param options
  * @param options.text The flair text for this template.
  * @param options.cssClass The CSS class for this template.
  * @param options.textEditable Determines whether users should be able to edit their flair text.
  when it has this template
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').createUserFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
  */
  async createUserFlairTemplate(options: { text: string; cssClass?: string; textEditable?: boolean }) {
    return this._createFlairTemplate({ ...options, flair_type: 'USER_FLAIR' });
  }

  /**
  * Creates a new link flair template for this subreddit
  * @param options
  * @param options.text The flair text for this template
  * @param options.cssClass The CSS class for this template
  * @param options.textEditable Determines whether users should be able to edit the flair text of their
  links when it has this template
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').createLinkFlairTemplate({text: 'Some Flair Text', cssClass: 'some-css-class'})
  */
  async createLinkFlairTemplate(options: { text: string; cssClass?: string; textEditable?: boolean; }) {
    return this._createFlairTemplate({ ...options, flair_type: 'LINK_FLAIR' });
  }

  // TODO: Add shortcuts for this on RedditUser and Submission
  async _getFlairOptions({ name, link, is_newlink }: { name?: string; link?: string; is_newlink?: boolean; } = {}) {
    return this._post<{
      choices: {
        flair_css_class: string;
        flair_template_id: string;
        flair_text_editable: boolean;
        flair_text: string;
        position: number;
      }[];
      current: {
        flair_css_class: string;
        flair_template_id: string;
        flair_text_editable: boolean;
        flair_text: string;
        position: string;
      }[];
    }>({ uri: `r/${this.displayName}/api/flairselector`, form: { name, link, is_newlink } });
  }

  /**
  * Gets the flair templates for the subreddit or a given link.
  * @param linkId The link's base36 ID
  * @returns An Array of flair template options
  * @example
  *
  * r.getSubreddit('snoowrap').getLinkFlairTemplates('4fp36y').then(console.log)
  // => [ { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  { flair_css_class: '',
  //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  ...
  // ]
  */
  async getLinkFlairTemplates(linkId?: string) {
    const options = linkId ? { link: linkId } : { is_newlink: true };
    return this._getFlairOptions(options).then(result => result.choices);
  }

  /**
  * Gets the list of user flair templates on this subreddit.
  * @returns An Array of user flair templates
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlairTemplates().then(console.log)
  // => [ { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  { flair_css_class: '',
  //  flair_template_id: '03821f62-c920-11e5-b608-0e309fbcf863',
  //  flair_text_editable: true,
  //  flair_position: 'right',
  //  flair_text: '' },
  //  ...
  // ]
  */
  async getUserFlairTemplates() {
    return this._getFlairOptions().then(result => result.choices);
  }

  /**
  * Clears a user's flair on this subreddit.
  * @param name The user's name
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteUserFlair('actually_an_aardvark')
  */
  async deleteUserFlair(name: string) {
    return this._post({ uri: `r/${this.displayName}/api/deleteflair`, form: { api_type: 'json', name } }).then(() => this);
  }

  /**
  * Gets a user's flair on this subreddit.
  * @param name The user's name
  * @returns An object representing the user's flair
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlair('actually_an_aardvark').then(console.log)
  // => { flair_css_class: '',
  //  flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721',
  //  flair_text: '',
  //  flair_position: 'right'
  // }
  */
  async getUserFlair(name: string) {
    return this._getFlairOptions({ name }).then(result => result.current);
  }

  /**
  * Sets multiple user flairs at the same time
  * @desc Due to the behavior of the reddit API endpoint that this function uses, if any of the provided user flairs are
  invalid, reddit will make note of this in its response, but it will still attempt to set the remaining user flairs. If this
  occurs, the Promise returned by snoowrap will be rejected, and the rejection reason will be an array containing the 'error'
  responses from reddit.
  * @param flairArray
  * @param flairArray[].name A user's name
  * @param flairArray[].text The flair text to assign to this user
  * @param flairArray[].cssClass The flair CSS class to assign to this user
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example
  * r.getSubreddit('snoowrap').setMultipleUserFlairs([
  *   {name: 'actually_an_aardvark', text: "this is /u/actually_an_aardvark's flair text", cssClass: 'some-css-class'},
  *   {name: 'snoowrap_testing', text: "this is /u/snoowrap_testing's flair text", cssClass: 'some-css-class'}
  * ]);
  * // the above request gets completed successfully
  *
  * r.getSubreddit('snoowrap').setMultipleUserFlairs([
  *   {name: 'actually_an_aardvark', text: 'foo', cssClass: 'valid-css-class'},
  *   {name: 'snoowrap_testing', text: 'bar', cssClass: "this isn't a valid css class"},
  *   {name: 'not_an_aardvark', text: 'baz', cssClass: "this also isn't a valid css class"}
  * ])
  * // the Promise from the above request gets rejected, with the following rejection reason:
  * [
  *   {
  *     status: 'skipped',
  *     errors: { css: 'invalid css class `this isn\'t a valid css class\', ignoring' },
  *     ok: false,
  *     warnings: {}
  *   },
  *   {
  *     status: 'skipped',
  *     errors: { css: 'invalid css class `this also isn\'t a valid css class\', ignoring' },
  *     ok: false,
  *     warnings: {}
  *   }
  * ]
  * // note that /u/actually_an_aardvark's flair still got set by the request, even though the other two flairs caused errors.
  */
  async setMultipleUserFlairs(flairArray: { name: string; text: string; cssClass: string; }[]) {
    const csvLines = flairArray.map(item => {
      // reddit expects to receive valid CSV data, which each line having the form `username,flair_text,css_class`.
      return [
        item.name,
        // @ts-expect-error
        item.text || item.flairText || item.flair_text || '',
        // @ts-expect-error
        item.cssClass || item.css_class || item.flairCssClass || item.flair_css_class || ''
      ].map(str => {
        /* To escape special characters in the lines (e.g. if the flair text itself contains a comma), surround each
        part of the line with double quotes before joining the parts together with commas (in accordance with how special
        characters are usually escaped in CSV). If double quotes are themselves part of the flair text, replace them with a
        pair of consecutive double quotes. */
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',');
    });
    /* Due to an API limitation, this endpoint can only set the flair of 100 users at a time.
    Send multiple requests if necessary to ensure that all users in the array are accounted for. */
    return pMap(chunk(csvLines, 100), flairChunk => {
      return this._post<{ ok: boolean; }>({ uri: `r/${this.displayName}/api/flaircsv`, form: { flair_csv: flairChunk.join('\n') } });
    }).then(flatten).then(pTap(results => {
      const errorRows = results.filter(row => !row.ok);
      if (errorRows.length) {
        throw errorRows;
      }
    })).then(() => this);
  }

  /**
  * Gets a list of all user flairs on this subreddit.
  * @param options
  * @param options.name A specific username to jump to
  * @returns A Listing containing user flairs
  * @example
  *
  * r.getSubreddit('snoowrap').getUserFlairList().then(console.log)
  // => Listing [
  //  { flair_css_class: null,
  //  user: 'not_an_aardvark',
  //  flair_text: 'Isn\'t an aardvark' },
  //  { flair_css_class: 'some-css-class',
  //    user: 'actually_an_aardvark',
  //    flair_text: 'this is /u/actually_an_aardvark\'s flair text' },
  //  { flair_css_class: 'some-css-class',
  //    user: 'snoowrap_testing',
  //    flair_text: 'this is /u/snoowrap_testing\'s flair text' }
  // ]
  */
  async getUserFlairList(options: { name?: string } = {}) {
    return this._getListing({
      uri: `r/${this.displayName}/api/flairlist`, qs: options, _transform: response => {
        /* For unknown reasons, responses from the api/flairlist endpoint are formatted differently than responses from all other
        Listing endpoints. Most Listing endpoints return an object with a `children` property containing the Listing's children,
        and `after` and `before` properties corresponding to the `after` and `before` querystring parameters that a client should
        use in the next request. However, the api/flairlist endpoint returns an object with a `users` property containing the
        Listing's children, and `next` and `prev` properties corresponding to the `after` and `before` querystring parameters. As
        far as I can tell, there's no actual reason for this difference. >_> */
        response.after = response.next || null;
        response.before = response.prev || null;
        response.children = response.users;
        return this._r._newObject('Listing', response);
      }
    });
  }

  /**
  * Configures the flair settings for this subreddit.
  * @param {object} options
  * @param {boolean} options.userFlairEnabled Determines whether user flair should be enabled
  * @param {string} options.userFlairPosition Determines the orientation of user flair relative to a given username. This
  should be either the string 'left' or the string 'right'.
  * @param {boolean} options.userFlairSelfAssignEnabled Determines whether users should be able to edit their own flair
  * @param {string} options.linkFlairPosition Determines the orientation of link flair relative to a link title. This should
  be either 'left' or 'right'.
  * @param {boolean} options.linkFlairSelfAssignEnabled Determines whether users should be able to edit the flair of their
  submissions.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').configure_flair({
    userFlairEnabled: true,
    userFlairPosition: 'left',
    userFlairSelfAssignEnabled: false,
    linkFlairPosition: 'right',
    linkFlairSelfAssignEnabled: false
  * })
  */
  async configureFlair({
    userFlairEnabled,
    userFlairPosition,
    userFlairSelfAssignEnabled,
    linkFlairPosition,
    linkFlairSelfAssignEnabled
  }: {
    userFlairEnabled: boolean;
    userFlairPosition: string;
    userFlairSelfAssignEnabled: boolean;
    linkFlairPosition: string;
    linkFlairSelfAssignEnabled: boolean;
  }) {
    return this._post({
      uri: `r/${this.displayName}/api/flairconfig`, form: {
        api_type: 'json',
        flair_enabled: userFlairEnabled,
        flair_position: userFlairPosition,
        flair_self_assign_enabled: userFlairSelfAssignEnabled,
        link_flair_position: linkFlairPosition,
        link_flair_self_assign_enabled: linkFlairSelfAssignEnabled
      }
    }).then(() => this);
  }

  /**
  * Gets the requester's flair on this subreddit.
  * @returns An object representing the requester's current flair
  * @example
  *
  * r.getSubreddit('snoowrap').getMyFlair().then(console.log)
  // => { flair_css_class: 'some-css-class',
  //  flair_template_id: null,
  //  flair_text: 'this is /u/snoowrap_testing\'s flair text',
  //  flair_position: 'right'
  // }
  */
  async getMyFlair() {
    return this._getFlairOptions().then(result => result.current);
  }

  /**
  * Sets the requester's flair on this subreddit.
  * @param {object} options
  * @param {string} options.flair_template_id A flair template ID to use. (This should be obtained beforehand using
  {@link getUserFlairTemplates}.)
  * @param {string} [options.text] The flair text to use. (This is only necessary/useful if the given flair
  template has the `text_editable` property set to `true`.)
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').selectMyFlair({flair_template_id: 'fdfd8532-c91e-11e5-b4d4-0e082084d721'})
  */
  async selectMyFlair(options: { flair_template_id: string; text?: string; }) {
    /* NOTE: This requires `identity` scope in addition to `flair` scope, since the reddit api needs to be passed a username.
    I'm not sure if there's a way to do this without requiring additional scope. */
    return this._r._getMyName().then(name => {
      return this._r._selectFlair({ ...options, subredditName: this.displayName, name });
    }).then(() => this);
  }

  private async _setMyFlairVisibility(flair_enabled: boolean) {
    return this._post({ uri: `r/${this.displayName}/api/setflairenabled`, form: { api_type: 'json', flair_enabled } }).then(() => this);
  }

  /**
  * Makes the requester's flair visible on this subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').showMyFlair()
  */
  async showMyFlair() {
    return this._setMyFlairVisibility(true);
  }

  /**
  * Makes the requester's flair invisible on this subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').hideMyFlair()
  */
  async hideMyFlair() {
    return this._setMyFlairVisibility(false);
  }

  /**
  * Creates a new selfpost on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} [options.text] The selftext of the submission
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns The newly-created Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').submitSelfpost({title: 'this is a selfpost', text: "hi, how's it going?"}).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  */
  async submitSelfpost(options: { title: string; text: string; sendReplies?: boolean; captchaIden?: string; captchaResponse?: string; }) {
    return this._r.submitSelfpost({ ...options, subredditName: this.displayName });
  }

  /**
  * Creates a new link submission on this subreddit.
  * @param {object} options An object containing details about the submission
  * @param {string} options.title The title of the submission
  * @param {string} options.url The url that the link submission should point to
  * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
  * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
  the past, reddit will return an error. This could be used to avoid accidental reposts.
  * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
  requires a captcha to submit posts and comments.
  * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
  * @returns The newly-created Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').submitLink({title: 'I found a cool website', url: 'https://google.com'}).then(console.log)
  * // => Submission { name: 't3_4abmsz' }
  */
  async submitLink(options: { title: string; url: string; sendReplies?: boolean; captchaIden?: string; captchaResponse?: string; }) {
    return this._r.submitLink({ ...options, subredditName: this.displayName });
  }

  /**
   * Creates a new crosspost submission on this subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.title The title of the crosspost
   * @param {string|Submission} options.originalPost A Submission object or a post ID for the original post which
   is being crossposted
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns The newly-created Submission object
   * @example
   *
   * await r.getSubreddit('snoowrap').submitCrosspost({ title: 'I found an interesting post', originalPost: '6vths0' })
   * // => Submission { name: 't3_4abmsz' }
   */
  async submitCrosspost(options: { title: string; originalPost: string | Submission; sendReplies?: boolean; captchaIden?: string; captchaResponse?: string; }) {
    return this._r.submitCrosspost({ ...options, subredditName: this.displayName });
  }

  /**
  * Gets a Listing of hot posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getHot().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getHot(options: $TSFIXME) {
    return this._r.getHot(this.displayName, options);
  }

  /**
  * Gets a Listing of new posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getNew().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  *
  */
  async getNew(options: $TSFIXME) {
    return this._r.getNew(this.displayName, options);
  }

  /**
  * Gets a Listing of new comments on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns A Listing containing the retrieved comments
  * @example
  *
  * r.getSubreddit('snoowrap').getNewComments().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  async getNewComments(options: $TSFIXME) {
    return this._r.getNewComments(this.displayName, options);
  }

  /**
  * Gets a single random Submission from this subreddit.
  * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
  redirect which cannot be followed by a CORS request.
  * @returns The retrieved Submission object
  * @example
  *
  * r.getSubreddit('snoowrap').getRandomSubmission().then(console.log)
  * // => Submission { ... }
  */
  async getRandomSubmission() {
    return this._r.getRandomSubmission(this.displayName);
  }

  /**
  * Gets a Listing of top posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing.
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of `hour, day, week, month, year, all`.
  * @returns A Listing containing the retrieved submissions.
  * @example
  *
  * r.getSubreddit('snoowrap').getTop({time: 'all'}).then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  async getTop(options: { time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' }) {
    return this._r.getTop(this.displayName, options);
  }

  /**
  * Gets a Listing of controversial posts on this subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @param {string} [options.time] Describes the timespan that posts should be retrieved from. Should be one of `hour, day, week, month, year, all`
  * @returns A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getControversial({time: 'week'}).then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  ...
  * // ]
  */
  async getControversial(options: { time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' }) {
    return this._r.getControversial(this.displayName, options);
  }

  /**
  * Gets a Listing of top posts on this subreddit.
  * @param {object} [options] Options for the resulting Listing
  * @returns A Listing containing the retrieved submissions
  * @example
  *
  * r.getSubreddit('snoowrap').getRising().then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getRising(options?: $TSFIXME) {
    return this._r.getRising(this.displayName, options);
  }

  /**
  * Gets the moderator mail for this subreddit.
  * @param {object} [options] Options for the resulting Listing
  * @returns A Listing containing PrivateMessage objects
  * @example r.getSubreddit('snoowrap').getModmail().then(console.log)
  */
  async getModmail(options?: $TSFIXME) {
    return this._getListing({ uri: `r/${this.displayName}/about/message/moderator`, qs: options });
  }

  /**
  * Gets a list of ModmailConversations from the subreddit.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns {Promise<Listing<ModmailConversation>>} A Listing containing Subreddits
  * @example
  *
  * r.getSubreddit('snoowrap').getNewModmailConversations({limit: 2}).then(console.log)
  * // => Listing [
  * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... },
  * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
  * // ]
  */
  async getNewModmailConversations(options: $TSFIXME = {}) {
    return this._r.getNewModmailConversations({ ...options, entity: this.displayName });
  }

  /**
  * Gets the moderation log for this subreddit.
  * @param options Options for the resulting Listing
  * @param options.mods An array of moderator names that the results should be restricted to
  * @param options.type Restricts the results to the specified type. This should be one of `banuser, unbanuser,
  removelink, approvelink, removecomment, approvecomment, addmoderator, invitemoderator, uninvitemoderator,
  acceptmoderatorinvite, removemoderator, addcontributor, removecontributor, editsettings, editflair, distinguish, marknsfw,
  wikibanned, wikicontributor, wikiunbanned, wikipagelisted, removewikicontributor, wikirevise, wikipermlevel,
  ignorereports, unignorereports, setpermissions, setsuggestedsort, sticky, unsticky, setcontestmode, unsetcontestmode,
  lock, unlock, muteuser, unmuteuser, createrule, editrule, deleterule, spoiler, unspoiler`
  * @returns A Listing containing moderation actions
  * @example
  *
  * r.getSubreddit('snoowrap').getModerationLog().then(console.log)
  *
  * // => Listing [
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'editflair', ... }
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'approvecomment', ... }
  * //  ModAction { description: null, mod: 'snoowrap_testing', action: 'createrule', ... }
  * // ]
  */
  async getModerationLog(options: {
    mods?: string[];
    type?: ModLogAction;
  } = {}) {
    const parsedOptions = omit({ ...options, mod: options.mods && options.mods.join(',') }, 'mods');
    return this._getListing<{ description: null; mod: string; action: ModLogAction; }>({ uri: `r/${this.displayName}/about/log`, qs: parsedOptions });
  }

  /**
  * Gets a list of reported items on this subreddit.
  * @param options Options for the resulting Listing
  * @param options.only Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns A Listing containing reported items
  * @example
  *
  * r.getSubreddit('snoowrap').getReports().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getReports(options: { only?: string } = {}): Promise<Listing<Comment | Submission>> {
    return this._getListing<Comment | Submission>({ uri: `r/${this.displayName}/about/reports`, qs: options });
  }

  /**
  * Gets a list of removed items on this subreddit.
  * @param options Options for the resulting Listing.
  * @param options.only Restricts the Listing to the specified type of item. One of `links, comments`.
  * @returns A Listing containing removed items.
  * @example
  *
  * r.getSubreddit('snoowrap').getSpam().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getSpam(options: { only?: 'links' | 'comments' } = {}): Promise<Listing<Comment | Submission>> {
    return this._getListing<Comment | Submission>({ uri: `r/${this.displayName}/about/spam`, qs: options });
  }

  /**
  * Gets a list of items on the modqueue on this subreddit.
  * @param options Options for the resulting Listing
  * @param options.only Restricts the Listing to the specified type of item. One of `links, comments`
  * @returns A Listing containing items on the modqueue
  * @example
  *
  * r.getSubreddit('snoowrap').getModqueue().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getModqueue(options: { only?: 'links' | 'comments' } = {}): Promise<Listing<Comment | Submission>> {
    return this._getListing<Comment | Submission>({ uri: `r/${this.displayName}/about/modqueue`, qs: options });
  }

  /**
  * Gets a list of unmoderated items on this subreddit.
  * @param options Options for the resulting Listing
  * @param options.only Restricts the Listing to the specified type of item. One of `links, comments`.
  * @returns A Listing containing unmoderated items
  * @example
  *
  * r.getSubreddit('snoowrap').getUnmoderated().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getUnmoderated(options: { only?: 'links' | 'comments' } = {}): Promise<Listing<Comment | Submission>> {
    return this._getListing<Comment | Submission>({ uri: `r/${this.displayName}/about/unmoderated`, qs: options });
  }

  /**
  * Gets a list of edited items on this subreddit.
  * @param options Options for the resulting Listing
  * @param options.only Restricts the Listing to the specified type of item. One of `links, comments`.
  * @returns A Listing containing edited items
  * @example
  *
  * r.getSubreddit('snoowrap').getEdited().then(console.log)
  * // => Listing [
  * //  Comment { ... },
  * //  Comment { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async getEdited(options: { only?: 'links' | 'comments' } = {}): Promise<Listing<Comment | Submission>> {
    return this._getListing({ uri: `r/${this.displayName}/about/edited`, qs: options });
  }

  /**
  * Accepts an invite to become a moderator of this subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').acceptModeratorInvite()
  */
  async acceptModeratorInvite() {
    return this._post<{ json: { errors: string[]; }; }>({
      uri: `r/${this.displayName}/api/accept_moderator_invite`,
      form: { api_type: 'json' }
    }).then(handleJsonErrors(this));
  }

  /**
  * Abdicates moderator status on this subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').leaveModerator()
  */
  async leaveModerator() {
    return this.fetch<FetchedSubmission>().then(result => result.name).then(name => {
      return this._post<{ json: { errors: string[]; }; }>({ uri: 'api/leavemoderator', form: { id: name } }).then(handleJsonErrors(this));
    });
  }

  /**
  * Abdicates approved submitter status on this subreddit.
  * @returns A Promise that resolves with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').leaveContributor()
  */
  async leaveContributor() {
    return this.fetch<Subreddit>().then(result => result.name).then(name => this._post({ uri: 'api/leavecontributor', form: { id: name } }).then(() => this));
  }

  /**
  * Gets a subreddit's CSS stylesheet.
  * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a redirect which cannot be followed by a CORS request.
  * @desc **Note**: This method will return a 404 error if the subreddit in question does not have a custom stylesheet.
  * @returns A Promise for a string containing the subreddit's CSS.
  * @example
  *
  * r.getSubreddit('snoowrap').getStylesheet().then(console.log)
  * // => '.md blockquote,.md del,body{color:#121212}.usertext-body ... '
  */
  async getStylesheet() {
    return this._get<string>({ uri: `r/${this.displayName}/stylesheet`, json: false });
  }

  /**
  * Conducts a search of reddit submissions, restricted to this subreddit.
  * @param options Search options. Can also contain options for the resulting Listing.
  * @param options.query The search query
  * @param options.time Describes the timespan that posts should be retrieved from. One of `hour, day, week, month, year, all`.
  * @param options.sort Determines how the results should be sorted. One of `relevance, hot, top, new, comments`.
  * @param options.syntax Specifies a syntax for the search. One of `cloudsearch, lucene, plain`.
  * @returns A Listing containing the search results.
  * @example
  *
  * r.getSubreddit('snoowrap').search({query: 'blah', sort: 'year'}).then(console.log)
  * // => Listing [
  * //  Submission { ... },
  * //  Submission { ... },
  * //  ...
  * // ]
  */
  async search(options: {
    query: string;
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    syntax: 'cloudsearch' | 'lucene' | 'plain';
  }) {
    return this._r.search({ ...options, subreddit: this, restrictSr: true });
  }

  /**
  * Gets the list of banned users on this subreddit.
  * @param options Filtering options. Can also contain options for the resulting Listing.
  * @param options.name A username on the list to jump to.
  * @returns A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  *
  */
  async getBannedUsers(options: { name?: string }) {
    return this._getListing<{ date: number; note: string; name: string; id: string; }>({ uri: `r/${this.displayName}/about/banned`, qs: renameKey(options, 'name', 'user') });
  }

  /**
  * Gets the list of muted users on this subreddit.
  * @param options Filtering options. Can also contain options for the resulting Listing.
  * @param options.name A username on the list to jump to.
  * @returns A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getBannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  async getMutedUsers(options: { name?: string }) {
    return this._getListing<{ date: number; name: string; id: string; }>({ uri: `r/${this.displayName}/about/muted`, qs: renameKey(options, 'name', 'user') });
  }

  /**
  * Gets the list of users banned from this subreddit's wiki.
  * @param options Filtering options. Can also contain options for the resulting Listing.
  * @param options.name A username on the list to jump to.
  * @returns A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getWikibannedUsers().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, note: '', name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  async getWikibannedUsers(options: { name?: string }) {
    return this._getListing<{ date: number; note: string; name: string; id: string; }>({ uri: `r/${this.displayName}/about/wikibanned`, qs: renameKey(options, 'name', 'user') });
  }

  /**
  * Gets the list of approved submitters on this subreddit.
  * @param options Filtering options. Can also contain options for the resulting Listing.
  * @param options.name A username on the list to jump to.
  * @returns A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getContributors().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  async getContributors(options: { name?: string }) {
    return this._getListing<{ date: number; name: string; id: string; }>({ uri: `r/${this.displayName}/about/contributors`, qs: renameKey(options, 'name', 'user') });
  }

  /**
  * Gets the list of approved wiki submitters on this subreddit .
  * @param options Filtering options. Can also contain options for the resulting Listing.
  * @param options.name A username on the list to jump to.
  * @returns A Listing of users
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiContributors().then(console.log)
  * // => Listing [
  * //  { date: 1461720936, name: 'actually_an_aardvark', id: 't2_q3519' }
  * //  ...
  * // ]
  */
  async getWikiContributors(options: { name?: string }) {
    return this._getListing<{ date: number; name: string; id: string; }>({ uri: `r/${this.displayName}/about/wikicontributors`, qs: renameKey(options, 'name', 'user') });
  }

  /**
  * Gets the list of moderators on this subreddit.
  * @param options
  * @param options.name The name of a user to find in the list
  * @returns An Array of RedditUsers representing the moderators of this subreddit
  * @example
  *
  * r.getSubreddit('AskReddit').getModerators().then(console.log)
  * // => [
  * //  RedditUser { date: 1453862639, mod_permissions: [ 'all' ], name: 'not_an_aardvark', id: 't2_k83md' },
  * //  ...
  * // ]
  *
  */
  async getModerators({ name }: { name?: string } = {}) {
    return this._get<RedditUser>({ uri: `r/${this.displayName}/about/moderators`, qs: { user: name } });
  }

  /**
  * Deletes the banner for this Subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteBanner()
  */
  async deleteBanner() {
    return this._post<{ json: { errors: string[]; } }>({ uri: `r/${this.displayName}/api/delete_sr_banner`, form: { api_type: 'json' } }).then(handleJsonErrors(this));
  }

  /**
  * Deletes the header image for this Subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteHeader()
  */
  async deleteHeader() {
    return this._post<{ json: { errors: string[]; } }>({ uri: `r/${this.displayName}/api/delete_sr_header`, form: { api_type: 'json' } }).then(handleJsonErrors(this));
  }

  /**
  * Deletes this subreddit's icon.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteIcon()
  */
  async deleteIcon() {
    return this._post<{ json: { errors: string[]; } }>({ uri: `r/${this.displayName}/api/delete_sr_icon`, form: { api_type: 'json' } }).then(handleJsonErrors(this));
  }

  /**
  * Deletes an image from this subreddit.
  * @param options
  * @param options.imageName The name of the image.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').deleteImage()
  */
  async deleteImage({ imageName }: { imageName: string }) {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `r/${this.displayName}/api/delete_sr_img`,
      form: { api_type: 'json', img_name: imageName }
    }).then(handleJsonErrors(this));
  }

  /**
  * Gets this subreddit's current settings.
  * @returns An Object containing this subreddit's current settings.
  * @example
  *
  * r.getSubreddit('snoowrap').getSettings().then(console.log)
  * // => SubredditSettings { default_set: true, submit_text: '', subreddit_type: 'private', ... }
  */
  async getSettings() {
    return this._get<{ default_set: boolean; submit_text: string; subreddit_type: 'private' | 'public' }>({ uri: `r/${this.displayName}/about/edit` });
  }

  /**
  * Edits this subreddit's settings.
  * @param {object} options An Object containing {[option name]: new value} mappings of the options that should be modified. Any omitted option names will simply retain their previous values.
  * @param {string} options.title The text that should appear in the header of the subreddit.
  * @param {string} options.public_description The text that appears with this Subreddit on the search page, or on the blocked-access page if this subreddit is private. (500 characters max)
  * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
  * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max).
  * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only allowed for gold-only subreddits.)
  * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag).
  * @param {string} [options.type='public'] Determines who should be able to access the subreddit. This should be one of `public, private, restricted, gold_restricted, gold_only, archived, employees_only`.
  * @param {string} [options.link_type='any'] Determines what types of submissions are allowed on the subreddit. This should be one of `any, link, self`.
  * @param {string} [options.submit_link_label=undefined] Custom text to display on the button that submits a link. If this is omitted, the default text will be displayed.
  * @param {string} [options.submit_text_label=undefined] Custom text to display on the button that submits a selfpost. If this is omitted, the default text will be displayed.
  * @param {string} [options.wikimode='modonly'] Determines who can edit wiki pages on the subreddit. This should be one of `modonly, anyone, disabled`.
  * @param {number} [options.wiki_edit_karma=0] The minimum amount of subreddit karma needed for someone to edit this subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {number} [options.wiki_edit_age=0] The minimum account age (in days) needed for someone to edit this subreddit's wiki. (This is only relevant if `options.wikimode` is set to `anyone`.)
  * @param {string} [options.spam_links='high'] The spam filter strength for links on this subreddit. This should be one of `low, high, all`.
  * @param {string} [options.spam_selfposts='high'] The spam filter strength for selfposts on this subreddit. This should be one of `low, high, all`.
  * @param {string} [options.spam_comments='high'] The spam filter strength for comments on this subreddit. This should be one of `low, high, all`.
  * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW.
  * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and trending subreddits.
  * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit.
  * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this subreddit.
  * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be enabled on this subreddit.
  * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be excluded from the modqueue.
  * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be viewable by anyone.
  * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be collapsed by default.
  * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be
  one of `confidence, top, new, controversial, old, random, qa`. If left blank, there will be no suggested sort,
  which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
  * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').editSettings({submit_text: 'Welcome! Please be sure to read the rules.'})
  */
  async editSettings(options: {
    title: string;
    public_description: string;
    description: string;
    submit_text?: string;
    hide_ads?: boolean;
    lang?: 'en';
    type?: SubredditType;
    link_type?: 'any' | 'link' | 'self';
    submit_link_label?: string;
    submit_text_label?: string;
    wikimode?: 'modonly' | 'anyone' | 'disabled';
    wiki_edit_karma?: number;
    wiki_edit_age?: number;
    spam_links: SpamLevels;
    spam_selfposts: SpamLevels;
    spam_comments: SpamLevels;
    over_18?: boolean;
    allow_top?: boolean;
    show_media?: boolean;
    show_media_preview?: boolean;
    allow_images?: boolean;
    exclude_banned_modqueue?: boolean;
    public_traffic?: boolean;
    collapse_deleted_comments?: boolean;
    suggested_comment_sort?: CommentSort;
    spoilers_enabled?: boolean;
  }) {
    return Promise.all([this.getSettings(), this.fetch<Subreddit>().then(result => result.name)]).then(([currentValues, name]) => {
      return this._r._createOrEditSubreddit({
        ...renameKey(currentValues, 'subreddit_type', 'type'),
        ...options,
        sr: name
      });
    }).then(() => this);
  }

  /**
  * Gets a list of recommended other subreddits given this one.
  * @param {object} [options]
  * @param {Array} [options.omit=[]] An Array of subreddit names that should be excluded from the listing.
  * @returns An Array of subreddit names
  * @example
  *
  * r.getSubreddit('AskReddit').getRecommendedSubreddits().then(console.log);
  * // [ 'TheChurchOfRogers', 'Sleepycabin', ... ]
  */
  async getRecommendedSubreddits(options: { omit?: string[] }): Promise<string[]> {
    const toOmit = options.omit && options.omit.join(',');
    return this._get<{ sr_name: string; }[]>({ uri: `api/recommend/sr/${this.displayName}`, qs: { omit: toOmit } }).then(results => results.map(name => name.sr_name));
  }

  /**
  * Gets the submit text (which displays on the submission form) for this subreddit.
  * @returns The submit text, represented as a string.
  * @example
  *
  * r.getSubreddit('snoowrap').getSubmitText().then(console.log)
  * // => 'Welcome! Please be sure to read the rules.'
  */
  async getSubmitText() {
    return this._get<{ submit_text: string; }>({ uri: `r/${this.displayName}/api/submit_text` }).then(result => result.submit_text);
  }

  /**
  * Updates this subreddit's stylesheet.
  * @param {object} options
  * @param {string} options.css The new contents of the stylesheet
  * @param {string} [options.reason] The reason for the change (256 characters max)
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').updateStylesheet({css: 'body {color:#00ff00;}', reason: 'yay green'})
  */
  async updateStylesheet({ css, reason }: { css: string; reason?: string; }) {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `r/${this.displayName}/api/subreddit_stylesheet`,
      form: { api_type: 'json', op: 'save', reason, stylesheet_contents: css }
    }).then(handleJsonErrors(this));
  }

  async _setSubscribed(status: boolean) {
    return this._post({
      uri: 'api/subscribe',
      form: { action: status ? 'sub' : 'unsub', sr_name: this.displayName }
    }).then(() => this);
  }

  /**
  * Subscribes to this subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').subscribe()
  */
  async subscribe() {
    return this._setSubscribed(true);
  }

  /**
  * Unsubscribes from this subreddit.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unsubscribe()
  */
  async unsubscribe() {
    /* Reddit returns a 404 error if the user attempts to unsubscribe to a subreddit that they weren't subscribed to in the
    first place. It also (as one would expect) returns a 404 error if the subreddit in question does not exist. snoowrap
    should swallow the first type of error internally, but it should raise the second type of error. Unfortunately, the errors
    themselves are indistinguishable. So if a 404 error gets thrown, fetch the current subreddit to check if it exists. If it
    does exist, then the 404 error was of the first type, so swallow it and return the current Subreddit object as usual. If
    the subreddit doesn't exist, then the original error was of the second type, so throw it. */
    // @ts-expect-error
    return this._setSubscribed(false).catch({ statusCode: 404 }, err => this.fetch().return(this).catchThrow(err));
  }

  async _uploadSrImg({ name, file, uploadType, imageType }: {
    name?: string;
    file: string | Readable;
    uploadType: 'img' | 'header' | 'banner' | 'icon';
    imageType: 'png' | 'jpg';
  }) {
    if (typeof file !== 'string' && !(file instanceof Readable)) {
      throw new InvalidMethodCallError('Uploaded image filepath must be a string or a ReadableStream.');
    }
    const parsedFile = typeof file === 'string' ? createReadStream(file) : file;
    return this._post<{ errors: string[]; }>({
      uri: `r/${this.displayName}/api/upload_sr_img`,
      formData: { name, upload_type: uploadType, img_type: imageType, file: parsedFile }
    }).then(result => {
      if (result.errors.length) {
        throw result.errors[0];
      }
      return this;
    });
  }

  /**
  * Uploads an image for use in this subreddit's stylesheet.
  * @param {object} options
  * @param {string} options.name The name that the new image should have in the stylesheet
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadSubredditImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  async uploadStylesheetImage({ name, file, imageType = 'png' }: {
    name: string;
    file: string | Readable;
    imageType: 'png' | 'jpg'
  }): Promise<this> {
    return this._uploadSrImg({ name, file, imageType, uploadType: 'img' });
  }

  /**
  * Uploads an image to use as this subreddit's header.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadHeaderImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  async uploadHeaderImage({ file, imageType = 'png' }: $TSFIXME) {
    return this._uploadSrImg({ file, imageType, uploadType: 'header' });
  }

  /**
  * Uploads an image to use as this subreddit's mobile icon.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadIcon({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  async uploadIcon({ file, image_type = 'png', imageType = image_type }: $TSFIXME) {
    return this._uploadSrImg({ file, imageType, uploadType: 'icon' });
  }

  /**
  * Uploads an image to use as this subreddit's mobile banner.
  * @param {object} options
  * @param {string|stream.Readable} options.file The image file that should get uploaded. This should either be the path to an
  image file, or a [ReadableStream](https://nodejs.org/api/stream.html#stream_class_stream_readable) for environments (e.g.
  browsers) where the filesystem is unavailable.
  * @param {string} [options.imageType='png'] Determines how the uploaded image should be stored. One of `png, jpg`
  * @returns A Promise that fulfills with this Subreddit when the request is complete.
  * @example r.getSubreddit('snoowrap').uploadBannerImage({name: 'the cookie monster', file: './cookie_monster.png'})
  */
  async uploadBannerImage({ file, image_type = 'png', imageType = image_type }: $TSFIXME) {
    return this._uploadSrImg({ file, imageType, uploadType: 'banner' });
  }

  /**
  * Gets information on this subreddit's rules.
  * @returns A Promise that fulfills with information on this subreddit's rules.
  * @example
  *
  * r.getSubreddit('snoowrap').getRules().then(console.log)
  *
  * // => {
  *   rules: [
  *     {
  *       kind: 'all',
  *       short_name: 'Rule 1: No violating rule 1',
  *       description: 'Breaking this rule is not allowed.',
  *       ...
  *     },
  *     ...
  *   ],
  *   site_rules: [
  *     'Spam',
  *     'Personal and confidential information'',
  *     'Threatening, harassing, or inciting violence'
  *   ]
  * }
  */
  async getRules() {
    return this._get({ uri: `r/${this.displayName}/about/rules` });
  }

  /**
  * Gets the stickied post on this subreddit, or throws a 404 error if none exists.
  * @param {object} [options]
  * @param {number} [options.num=1] The number of the sticky to get. Should be either `1` (first sticky) or `2` (second sticky).
  * @returns A Submission object representing this subreddit's stickied submission
  * @example
  * r.getSubreddit('snoowrap').getSticky({num: 2})
  * // => Submission { ... }
  */
  async getSticky({ num = 1 } = {}) {
    return this._get({ uri: `r/${this.displayName}/about/sticky`, qs: { num } });
  }

  async _friend(options: $TSFIXME): Promise<this> {
    return this._post<{ json: { errors: string[] } }>({
      uri: `r/${this.displayName}/api/friend`,
      form: { ...options, api_type: 'json' }
    }).then(handleJsonErrors(this));
  }

  async _unfriend(options: {
    name: string;
    type: 'moderator_invite' | 'moderator' | 'contributor' | 'wikicontributor' | 'banned' | 'muted' | 'wikibanned';
  }): Promise<this> {
    return this._post<{ json: { errors: string[] } }>({
      uri: `r/${this.displayName}/api/unfriend`,
      form: { ...options, api_type: 'json' }
    }).then(handleJsonErrors(this));
  }

  /**
  * Invites the given user to be a moderator of this subreddit.
  * @param options
  * @param options.name The username of the account that should be invited
  * @param options.permissions The moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').inviteModerator({name: 'actually_an_aardvark', permissions: ['posts', 'wiki']})
  */
  async inviteModerator({ name, permissions }: { name: string; permissions?: ('wiki' | 'posts' | 'access' | 'mail' | 'config' | 'flair')[] }): Promise<this> {
    return this._friend({ name, permissions: formatModPermissions(permissions ?? []), type: 'moderator_invite' });
  }

  /**
  * Revokes an invitation for the given user to be a moderator.
  * @param options
  * @param options.name The username of the account whose invitation should be revoked
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').revokeModeratorInvite({name: 'actually_an_aardvark'})
  */
  async revokeModeratorInvite({ name }: { name: string; }): Promise<this> {
    return this._unfriend({ name, type: 'moderator_invite' });
  }

  /**
  * Removes the given user's moderator status on this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account whose moderator status should be removed
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeModerator({name: 'actually_an_aardvark'})
  */
  async removeModerator({ name }: { name: string; }): Promise<this> {
    return this._unfriend({ name, type: 'moderator' });
  }

  /**
  * Makes the given user an approved submitter of this subreddit.
  * @param options
  * @param options.name The username of the account that should be given this status
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').addContributor({name: 'actually_an_aardvark'})
  */
  async addContributor({ name }: { name: string; }): Promise<this> {
    return this._friend({ name, type: 'contributor' });
  }

  /**
  * Revokes this user's approved submitter status on this subreddit.
  * @param options
  * @param options.name The username of the account whose status should be revoked
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeContributor({name: 'actually_an_aardvark'})
  */
  async removeContributor({ name }: { name: string; }): Promise<this> {
    return this._unfriend({ name, type: 'contributor' });
  }

  /**
  * Bans the given user from this subreddit.
  * @param {object} options
  * @param {string} options.name The username of the account that should be banned
  * @param {string} [options.banMessage] The ban message. This will get sent to the user in a private message, alerting them
  that they have been banned.
  * @param {string} [options.banReason] A string indicating which rule the banned user broke (100 characters max)
  * @param {number} [options.duration] The duration of the ban, in days. For a permanent ban, omit this parameter.
  * @param {string} [options.banNote] A note that appears on the moderation log, usually used to indicate the reason for the
  ban. This is not visible to the banned user. (300 characters max)
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').banUser({name: 'actually_an_aardvark', banMessage: 'You are now banned LOL'})
  */
  async banUser({
    name,
    banMessage,
    banReason,
    duration,
    banNote
  }: {
    name: string;
    banMessage?: string;
    banReason?: string;
    duration?: number;
    banNote?: string;
  }): Promise<this> {
    return this._friend({
      name, ban_message: banMessage,
      ban_reason: banReason,
      duration,
      note: banNote,
      type: 'banned'
    });
  }

  /**
  * Unbans the given user from this subreddit.
  * @param options
  * @param options.name The username of the account that should be unbanned
  * @returns A Promise that fulfills when the request is complete
  * @example r.getSubreddit('snoowrap').unbanUser({name: 'actually_an_aardvark'})
  */
  async unbanUser({ name }: { name: string }): Promise<this> {
    return this._unfriend({ name, type: 'banned' });
  }

  /**
  * Mutes the given user from messaging this subreddit for 72 hours.
  * @param options
  * @param options.name The username of the account that should be muted
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').muteUser({name: 'actually_an_aardvark'})
  */
  async muteUser({ name }: { name: string }): Promise<this> {
    return this._friend({ name, type: 'muted' });
  }

  /**
  * Unmutes the given user from messaging this subreddit.
  * @param options
  * @param options.name The username of the account that should be muted
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unmuteUser({name: 'actually_an_aardvark'})
  */
  async unmuteUser({ name }: { name: string }): Promise<this> {
    return this._unfriend({ name, type: 'muted' });
  }

  /**
  * Bans the given user from editing this subreddit's wiki.
  * @param options
  * @param options.name The username of the account that should be wikibanned
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').wikibanUser({name: 'actually_an_aardvark'})
  */
  async wikibanUser({ name }: { name: string }): Promise<this> {
    return this._friend({ name, type: 'wikibanned' });
  }

  /**
  * Unbans the given user from editing this subreddit's wiki.
  * @param {object} options
  * @param {string} options.name The username of the account that should be unwikibanned
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').unwikibanUser({name: 'actually_an_aardvark'})
  */
  async unwikibanUser({ name }: { name: string }): Promise<this> {
    return this._unfriend({ name, type: 'wikibanned' });
  }

  /**
  * Adds the given user to this subreddit's list of approved wiki editors.
  * @param options
  * @param options.name The username of the account that should be given approved editor status
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').addWikiContributor({name: 'actually_an_aardvark'})
  */
  async addWikiContributor({ name }: { name: string }): Promise<this> {
    return this._friend({ name, type: 'wikicontributor' });
  }

  /**
  * Removes the given user from this subreddit's list of approved wiki editors.
  * @param {object} options
  * @param {string} options.name The username of the account whose approved editor status should be revoked
  * @returns A Promise that fulfills with this Subreddit when the request is complete
  * @example r.getSubreddit('snoowrap').removeWikiContributor({name: 'actually_an_aardvark'})
  */
  async removeWikiContributor({ name }: { name: string }) {
    return this._unfriend({ name, type: 'wikicontributor' });
  }

  /**
  * Sets the permissions for a given moderator on this subreddit.
  * @param options
  * @param options.name The username of the moderator whose permissions are being changed
  * @param options.permissions The new moderator permissions that this user should have. This should be an array
  containing some combination of `"wiki", "posts", "access", "mail", "config", "flair"`. To add a moderator with full
  permissions, omit this property entirely.
  * @returns A Promise that fulfills with this Subreddit when this request is complete
  * @example r.getSubreddit('snoowrap').setModeratorPermissions({name: 'actually_an_aardvark', permissions: ['mail']})
  */
  async setModeratorPermissions({ name, permissions }: { name: string; permissions?: ('wiki' | 'posts' | 'access' | 'mail' | 'config' | 'flair')[] }) {
    return this._post<{ json: { errors: string[]; } }>({
      uri: `r/${this.displayName}/api/setpermissions`,
      form: { api_type: 'json', name, permissions: formatModPermissions(permissions ?? []), type: 'moderator' }
    }).then(handleJsonErrors(this));
  }

  /**
  * Gets a given wiki page on this subreddit.
  * @param title The title of the desired wiki page.
  * @returns An unfetched WikiPage object corresponding to the desired wiki page
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPage('index')
  * // => WikiPage { title: 'index', subreddit: Subreddit { displayName: 'snoowrap' } }
  */
  getWikiPage(title: string): WikiPage {
    return this._r._newObject<WikiPage>('WikiPage', { subreddit: this, title });
  }

  /**
  * Gets the list of wiki pages on this subreddit.
  * @returns An Array containing WikiPage objects
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiPages().then(console.log)
  * // => [
  * //   WikiPage { title: 'index', subreddit: Subreddit { displayName: 'snoowrap'} }
  * //   WikiPage { title: 'config/sidebar', subreddit: Subreddit { displayName: 'snoowrap'} }
  * //   WikiPage { title: 'secret_things', subreddit: Subreddit { displayName: 'snoowrap'} }
  * //   WikiPage { title: 'config/submit_text', subreddit: Subreddit { displayName: 'snoowrap'} }
  * // ]
  */
  async getWikiPages(): Promise<WikiPage[]> {
    return this._get<string[]>({ uri: `r/${this.displayName}/wiki/pages` }).then(results => results.map(title => this.getWikiPage(title)));
  }

  /**
  * Gets a list of revisions on this subreddit's wiki.
  * @param {object} [options] Options for the resulting Listing
  * @returns A Listing containing wiki revisions
  * @example
  *
  * r.getSubreddit('snoowrap').getWikiRevisions().then(console.log)
  * // => Listing [
  * //  { page: 'index', reason: 'added cookies', ... },
  * //  ...
  * // ]
  */
  async getWikiRevisions(options?: Record<string, unknown>): Promise<Listing<{ page: 'index'; reason: string; }>> {
    return this._getListing<{ page: 'index'; reason: string; }>({ uri: `r/${this.displayName}/wiki/revisions`, qs: options });
  }
};
