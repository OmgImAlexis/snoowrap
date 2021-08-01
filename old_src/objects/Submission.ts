import { getEmptyRepliesListing } from '../helpers';
import { Snoowrap } from '../snoowrap';
import { $TSFIXME } from '../ts-fix-me';
import { FetchedSubmission } from '../types/fetched-submission';
import { VoteableContent } from './VoteableContent';

/**
* A class representing a Reddit submission.
* @example
*
* // Get a submission by ID
* r.getSubmission('2np694')
*/
export class Submission extends VoteableContent {
  public readonly _name: string = 'Submission';
  declare public name: string;
  declare public comments: $TSFIXME;
  declare public subreddit: string;
  declare public _hasFetched: boolean;

  constructor (data: { name: string; subreddit?: string; comments?: string[] }, _r: Snoowrap, _hasFetched: boolean) {
    super(data, _r, _hasFetched);
    if (_hasFetched) {
      this.comments = this.comments || getEmptyRepliesListing(this);
    }
  }

  public get _uri () {
    return `comments/${this.name.slice(3)}`;
  }



  /**
  * @summary Sets the contest mode status of this submission.
  * @private
  * @param state The desired contest mode status
  * @returns The updated version of this Submission
  */
   async _setContestModeEnabled (state: boolean) {
    return this._post({uri: 'api/set_contest_mode', form: {api_type: 'json', state, id: this.name}}).then(() => this);
  }

  /**
  * @summary Enables contest mode for this Submission.
  * @returns The updated version of this Submission
  * @example r.getSubmission('2np694').enableContestMode()
  */
   async enableContestMode () {
    return this._setContestModeEnabled(true);
  }

  /**
  * @summary Disables contest mode for this Submission.
  * @returns The updated version of this Submission
  * @example r.getSubmission('2np694').disableContestMode()
  */
   async disableContestMode () {
    return this._setContestModeEnabled(false);
  }



  /**
  * @summary Sets the suggested comment sort method on this Submission
  * @desc **Note**: To enable contest mode, use {@link Submission#enableContestMode} instead.
  * @param sort The suggested sort method.
  * @returns The updated version of this Submission
  * @example r.getSubmission('2np694').setSuggestedSort('new')
  */
  async setSuggestedSort (sort: 'confidence' | 'top' | 'new' | 'controversial' | 'old' | 'random' | 'qa' | 'blank') {
    return this._post({uri: 'api/set_suggested_sort', form: {api_type: 'json', id: this.name, sort}}).then(() => this);
  }

  /**
  * @summary Marks this submission as 'visited'.
  * @desc **Note**: This function only works if the authenticated account has a subscription to reddit gold.
  * @returns The updated version of this Submission
  * @example r.getSubmission('2np694').markAsRead()
  */
  async markAsRead () {
    return this._post({uri: 'api/store_visits', form: {links: this.name}}).then(() => this);
  }

  /**
  * @summary Gets a Listing of other submissions on reddit that had the same link as this one.
  * @param {object} [options={}] Options for the resulting Listing
  * @returns A Listing of other Submission objects
  * @example r.getSubmission('2np694').getDuplicates()
  */
  async getDuplicates (options = {}) {
    return this._getListing({uri: `duplicates/${this.name.slice(3)}`, qs: options});
  }

  /**
  * @summary Gets a list of flair template options for this post.
  * @returns An Array of flair templates
  * @example
  *
  * r.getSubmission('2np694').getLinkFlairTemplates().then(console.log)
  *
  * // => [
  * //   { flair_text: 'Text 1', flair_css_class: '', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   { flair_text: 'Text 2', flair_css_class: 'aa', flair_text_editable: false, flair_template_id: '(UUID not shown)' ... },
  * //   ...
  * // ]
  */
  async getLinkFlairTemplates (): Promise<{ flair_text: string; flair_css_class: string; flair_text_editable: boolean; }[]> {
    return this.fetch().then(result => result.subreddit).then(sub => sub.getLinkFlairTemplates(this.name));
  }

  /**
  * @summary Assigns flair on this Submission (as a moderator; also see [selectFlair]{@link Submission#selectFlair})
  * @param options
  * @param options.text The text that this link's flair should have
  * @param options.cssClass The CSS class that the link's flair should have
  * @returns A Promise that fulfills with an updated version of this Submission
  * @example r.getSubmission('2np694').assignFlair({text: 'this is a flair text', cssClass: 'these are css classes'})
  */
  async assignFlair (options: { text?: string; cssClass?: string; }) {
    const subredditName = this._hasFetched ? (this as unknown as FetchedSubmission).subreddit.display_name : this.subreddit;
    return this._r._assignFlair({...options, link: this.name, subredditName }).then(() => this);
  }

  /**
  * @summary Selects a flair for this Submission (as the OP; also see [assignFlair]{@link Submission#assignFlair})
  * @param options
  * @param options.flair_template_id A flair template ID to use for this Submission. (This should be obtained beforehand using {@link getLinkFlairTemplates}.)
  * @param options.text The flair text to use for the submission. (This is only necessary/useful if the given flair template has the `text_editable` property set to `true`.)
  * @returns A Promise that fulfills with this objects after the request is complete
  * @example r.getSubmission('2np694').selectFlair({flair_template_id: 'e3340d80-8152-11e4-a76a-22000bc1096c'})
  */
  async selectFlair (options: { flair_template_id: string; text?: string; }) {
    const subredditName = this._hasFetched ? (this as unknown as FetchedSubmission).subreddit.display_name : this.subreddit;
    return this._r._selectFlair({...options, link: this.name, subredditName}).then(() => this);
  }

  /**
   * @summary Crossposts this submission to a different subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param options An object containing details about the submission
   * @param options.subredditName The name of the subreddit that the crosspost should be submitted to
   * @param options.title The title of the crosspost
   * @param options.sendReplies Determines whether inbox replies should be enabled for this submission
   * @param options.resubmit If this is false and same link has already been submitted to this subreddit in the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns The newly-created Submission object
   * @example
   *
   * await r.getSubmission('6vths0').submitCrosspost({ title: 'I found an interesting post', subredditName: 'snoowrap' })
   */
   async submitCrosspost (options: { subredditName: string; title: string; sendReplies?: boolean; resubmit?: boolean; }) {
    return this._r.submitCrosspost({...options, originalPost: this});
  }

  fetch<Fetched = FetchedSubmission>() {
    return super.fetch<Fetched>();
  }
};
