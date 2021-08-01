import { defaults, isEmpty, map, mapValues, omit, omitBy } from 'lodash';
import { credentialedClientRequest, unauthenticatedRequest } from './request_handler';
import { KINDS, MAX_LISTING_ITEMS, USER_KEYS, SUBREDDIT_KEYS } from './constants';
import * as errors from './errors';
import { Submission } from './objects/Submission';
import { Subreddit } from './objects/Subreddit';
import { Comment } from './objects/Comment';
import { RedditUser } from './objects/RedditUser';
import { LiveThread } from './objects/LiveThread';
import { PrivateMessage } from './objects/PrivateMessage';
import {
  addEmptyRepliesListing,
  addFullnamePrefix,
  handleJsonErrors,
  requiredArg
} from './helpers';
import { createConfig } from './create_config';
import * as objects from './objects/index';
import { oauthRequest } from './request_handler';
import pTap from 'p-tap';
import { ModmailConversationAuthor } from './objects/ModmailConversationAuthor';
import requestPromise from 'request-promise';
import request from 'request';
import { CommentSort, SpamLevels, SubredditType } from './types';
import { $TSFIXME } from './ts-fix-me';

export interface SnoowrapOptions {
  userAgent: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  username?: string;
  password?: string;
};

/** The class for a snoowrap requester.
 * A requester is the base object that is used to fetch content from reddit. Each requester contains a single set of OAuth
 tokens.

 If constructed with a refresh token, a requester will be able to repeatedly generate access tokens as necessary, without any
 further user intervention. After making at least one request, a requester will have the `access_token` property, which specifies
 the access token currently in use. It will also have a few additional properties such as `scope` (an array of scope strings)
 and `ratelimitRemaining` (the number of requests remaining for the current 10-minute interval, in compliance with reddit's
 [API rules](https://github.com/reddit/reddit/wiki/API).) These properties primarily exist for internal use, but they are
 exposed since they are useful externally as well.
 */
export class Snoowrap {
  _config: ReturnType<typeof createConfig>;
  private _ownUserInfo?: objects.RedditUser;

  userAgent?: string;
  refreshToken?: string | null;
  accessToken?: string | null;
  tokenExpiration?: number | null;
  clientId?: string | null;
  clientSecret?: string | null;
  username?: string | null;
  password?: string | null;
  ratelimitExpiration: number | null;
  ratelimitRemaining: number | null;
  scope: null;
  _nextRequestTimestamp: number;

  /**
   * Constructs a new requester.
   * @desc You should use the snoowrap constructor if you are able to authorize a reddit account in advance (e.g. for a Node.js
   script that always uses the same account). If you aren't able to authorize in advance (e.g. acting through an arbitrary user's
   account while running snoowrap in a browser), then you should use {@link snoowrap.getAuthUrl} and
   {@link snoowrap.fromAuthCode} instead.
   *
   * To edit snoowrap specific settings, see {@link snoowrap#config}.
   *
   * snoowrap supports several different options for pre-existing authentication:
   * 1. *Refresh token*: To authenticate with a refresh token, pass an object with the properties `userAgent`, `clientId`,
   `clientSecret`, and `refreshToken` to the snoowrap constructor. You will need to get the refresh token from reddit
   beforehand. A script to automatically generate refresh tokens for you can be found
   [here](https://github.com/not-an-aardvark/reddit-oauth-helper).
   * 1. *Username/password*: To authenticate with a username and password, pass an object with the properties `userAgent`,
   `clientId`, `clientSecret`, `username`, and `password` to the snoowrap constructor. Note that username/password
   authentication is only possible for `script`-type apps.
   * 1. *Access token*: To authenticate with an access token, pass an object with the properties `userAgent` and `accessToken`
   to the snoowrap constructor. Note that all access tokens expire one hour after being generated, so this method is
   not recommended for long-term use.
   * @param {object} options An object containing authentication options. This should always have the property `userAgent`. It
   must also contain some combination of credentials (see above)
   * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
   is running in a browser.
   * @param {string} [options.clientId] The client ID of your app (assigned by reddit)
   * @param {string} [options.clientSecret] The client secret of your app (assigned by reddit). If you are using a refresh token
   with an installed app (which does not have a client secret), pass an empty string as your `clientSecret`.
   * @param {string} [options.username] The username of the account to access
   * @param {string} [options.password] The password of the account to access
   * @param {string} [options.refreshToken] A refresh token for your app
   * @param {string} [options.accessToken] An access token for your app
   */
  constructor(options: SnoowrapOptions) {
    requiredArg('userAgent');

    if ((!options.accessToken || typeof options.accessToken !== 'string') &&
      (options.clientId === undefined || options.clientSecret === undefined || typeof options.refreshToken !== 'string') &&
      (options.clientId === undefined || options.clientSecret === undefined || options.username === undefined || options.password === undefined)
    ) {
      throw new errors.NoCredentialsError();
    }

    this.userAgent = options.userAgent;
    this.clientId = options.clientId ?? null
    this.clientSecret = options.clientSecret ?? null
    this.refreshToken = options.refreshToken ?? null
    this.accessToken = options.accessToken ?? null;
    this.username = options.username ?? null;
    this.password = options.password ?? null;

    this.ratelimitRemaining = null;
    this.ratelimitExpiration = null;
    this.tokenExpiration = null;
    this.scope = null;

    this._config = createConfig();
    this._nextRequestTimestamp = -Infinity;
  }

  /**
   * Gets an authorization URL, which allows a user to authorize access to their account
   * @desc This create a URL where a user can authorize an app to act through their account. If the user visits the returned URL
   in a web browser, they will see a page that looks like [this](https://i.gyazo.com/0325534f38b78c1dbd4c84d690dda6c2.png). If
   the user clicks "Allow", they will be redirected to your `redirectUri`, with a `code` querystring parameter containing an
   * *authorization code*. If this code is passed to {@link snoowrap.fromAuthCode}, you can create a requester to make
   requests on behalf of the user.
   *
   * The main use-case here is for running snoowrap in a browser. You can generate a URL, send the user there, and then continue
   after the user authenticates on reddit and is redirected back.
   *
   * @param {object} options
   * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running client side in a
   browser, using an "Installed" app type is recommended.
   * @param {string[]} options.scope An array of scopes (permissions on the user's account) to request on the authentication
   page. A list of possible scopes can be found [here](https://www.reddit.com/api/v1/scopes). You can also get them on-the-fly
   with {@link snoowrap#getOauthScopeList}.
   * @param {string} options.redirectUri The URL where the user should be redirected after authenticating. This **must** be the
   same as the redirect URI that is configured for the reddit app. (If there is a mismatch, the returned URL will display an
   error page instead of an authentication form.)
   * @param {boolean} [options.permanent=true] If `true`, the app will have indefinite access to the user's account. If `false`,
   access to the user's account will expire after 1 hour.
   * @param {string} [options.state] A string that can be used to verify a user after they are redirected back to the site. When
   the user is redirected from reddit, to the redirect URI after authenticating, the resulting URI will have this same `state`
   value in the querystring. (See [here](http://www.twobotechnologies.com/blog/2014/02/importance-of-state-in-oauth2.html) for
   more information on how to use the `state` value.)
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain for the URL. If the user is authenticating on
   reddit.com (as opposed to some other site with a reddit-like API), you can omit this value.
   * @returns A URL where the user can authenticate with the given options
   * @example
   *
   * var authenticationUrl = snoowrap.getAuthUrl({
   *   clientId: 'foobarbazquuux',
   *   scope: ['identity', 'wikiread', 'wikiedit'],
   *   redirectUri: 'https://example.com/reddit_callback',
   *   permanent: false,
   *   state: 'fe211bebc52eb3da9bef8db6e63104d3' // a random string, this could be validated when the user is redirected back
   * });
   * // --> 'https://www.reddit.com/api/v1/authorize?client_id=foobarbaz&response_type=code&state= ...'
   *
   * window.location.href = authenticationUrl; // send the user to the authentication url
   */
  static getAuthUrl({
    clientId,
    scope,
    redirectUri,
    permanent = true,
    state = '_',
    endpointDomain = 'reddit.com'
  }: {
    clientId: string;
    scope: string[];
    redirectUri: string;
    permanent?: boolean;
    state?: string;
    endpointDomain?: string;
  }): string {
    requiredArg('clientId');
    requiredArg('scope');
    requiredArg('redirectUri');

    if (!(Array.isArray(scope) && scope.length && scope.every(scopeValue => scopeValue && typeof scopeValue === 'string'))) {
      throw new TypeError('Missing `scope` argument; a non-empty list of OAuth scopes must be provided');
    }
    return `
      https://www.${endpointDomain}/api/v1/authorize?
      client_id=${encodeURIComponent(clientId)}
      &response_type=code
      &state=${encodeURIComponent(state)}
      &redirect_uri=${encodeURIComponent(redirectUri)}
      &duration=${permanent ? 'permanent' : 'temporary'}
      &scope=${encodeURIComponent(scope.join(' '))}
    `.replace(/\s/g, '');
  }

  /**
   * Creates a snoowrap requester from an authorization code.
   * @desc An authorization code is the `code` value that appears in the querystring after a user authenticates with reddit and
   is redirected. For more information, see {@link snoowrap.getAuthUrl}.
   *
   * The main use-case for this function is for running snoowrap in a browser. You can generate a URL with
   {@link snoowrap.getAuthUrl} and send the user to that URL, and then use this function to create a requester when
   the user is redirected back with an authorization code.
   * @param {object} options
   * @param {string} options.code The authorization code
   * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
   is running in a browser.
   * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running client side in a
   browser, using an "Installed" app type is recommended.
   * @param {string} [options.clientSecret] The client secret of your app. If your app has the "Installed" app type, omit
   this parameter.
   * @param {string} options.redirectUri The redirect URI that is configured for the reddit app.
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain that the returned requester should be configured
   to use. If the user is authenticating on reddit.com (as opposed to some other site with a reddit-like API), you can omit this
   value.
   * @returns A Promise that fulfills with a `snoowrap` instance.
   * @example
   *
   * // Get the `code` querystring param (assuming the user was redirected from reddit)
   * var code = new URL(window.location.href).searchParams.get('code');
   *
   * snoowrap.fromAuthCode({
   *   code: code,
   *   userAgent: 'My app',
   *   clientId: 'foobarbazquuux',
   *   redirectUri: 'example.com'
   * }).then(r => {
   *   // Now we have a requester that can access reddit through the user's account
   *   return r.getHot().then(posts => {
   *     // do something with posts from the front page
   *   });
   * })
   */
  static async fromAuthCode({
    code,
    userAgent,
    clientId,
    clientSecret,
    redirectUri,
    endpointDomain = 'reddit.com'
  }: {
    code: string;
    userAgent: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    endpointDomain?: string;
  }): Promise<Snoowrap> {
    requiredArg('code');
    requiredArg('userAgent');
    requiredArg('clientId');
    requiredArg('redirectUri');

    return credentialedClientRequest.bind({
      userAgent,
      clientId,
      clientSecret,
      // @ts-expect-error
      rawRequest: this.rawRequest
    } as Snoowrap)({
      method: 'post',
      baseUrl: `https://www.${endpointDomain}/`,
      uri: 'api/v1/access_token',
      form: { grant_type: 'authorization_code', code, redirect_uri: redirectUri }
    }).then(response => {
      if (response.error) {
        throw new errors.RequestError(`API Error: ${response.error} - ${response.error_description}`);
      }
      // Use `new this.constructor` instead of `new snoowrap` to ensure that subclass instances can be returned
      const requester = new (this.constructor as any)({ userAgent, clientId, clientSecret, ...response });
      requester.config({ endpointDomain });
      return requester;
    });
  }

  /**
   * Returns the grant types available for app-only authentication
   * @desc Per the Reddit API OAuth docs, there are two different grant types depending on whether the app is an installed client
   * or a confidential client such as a web app or string. This getter returns the possible values for the "grant_type" field
   * in application-only auth.
   * @returns The enumeration of possible grant_type values.
   */
  static get grantType() {
    return {
      CLIENT_CREDENTIALS: 'client_credentials',
      INSTALLED_CLIENT: 'https://oauth.reddit.com/grants/installed_client'
    };
  }

  /**
  * Creates a snoowrap requester from a "user-less" Authorization token
  * @desc In some cases, 3rd party app clients may wish to make API requests without a user context. App clients can request
  * a "user-less" Authorization token via either the standard client_credentials grant, or the reddit specific
  * extension to this grant, https://oauth.reddit.com/grants/installed_client. Which grant type an app uses depends on
  * the app-type and its use case.
  * @param {object} options
  * @param {string} options.userAgent A unique description of what your app does. This argument is not necessary when snoowrap
  is running in a browser.
  * @param {string} options.clientId The client ID of your app (assigned by reddit). If your code is running client side in a
  * browser, using an "Installed" app type is recommended.
  * @param {string} [options.clientSecret] The client secret of your app. Only required for "client_credentials" grant type.
  * @param {string} [options.deviceId] A unique, per-device ID generated by your client. Only required
  * for "Installed" grant type, needs to be between 20-30 characters long. From the reddit docs: "reddit *may* choose to use
  * this ID to generate aggregate data about user counts. Clients that wish to remain anonymous should use the value
  * DO_NOT_TRACK_THIS_DEVICE."
  * @param {string} [options.grantType=snoowrap.grantType.INSTALLED_CLIENT] The type of "user-less"
  * token to use {@link snoowrap.grantType}
  * @param {boolean} [options.permanent=true] If `true`, the app will have indefinite access. If `false`,
  access will expire after 1 hour.
  * @param {string} [options.endpointDomain='reddit.com'] The endpoint domain that the returned requester should be configured
  to use. If the user is authenticating on reddit.com (as opposed to some other site with a reddit-like API), you can omit this
  value.
  * @returns A Promise that fulfills with a `snoowrap` instance
  * @example
  *
  * snoowrap.fromApplicationOnlyAuth({
  *   userAgent: 'My app',
  *   clientId: 'foobarbazquuux',
  *   deviceId: 'unique id between 20-30 chars',
  *   grantType: snoowrap.grantType.INSTALLED_CLIENT
  * }).then(r => {
  *   // Now we have a requester that can access reddit through a "user-less" Auth token
  *   return r.getHot().then(posts => {
  *     // do something with posts from the front page
  *   });
  * })
  *
  * snoowrap.fromApplicationOnlyAuth({
  *   userAgent: 'My app',
  *   clientId: 'foobarbazquuux',
  *   clientSecret: 'your web app secret',
  *   grantType: snoowrap.grantType.CLIENT_CREDENTIALS
  * }).then(r => {
  *   // Now we have a requester that can access reddit through a "user-less" Auth token
  *   return r.getHot().then(posts => {
  *     // do something with posts from the front page
  *   });
  * })
  */
  static async fromApplicationOnlyAuth({
    userAgent,
    clientId,
    clientSecret,
    deviceId,
    grantType = Snoowrap.grantType.INSTALLED_CLIENT,
    permanent = true,
    endpointDomain = 'reddit.com'
  }: {
    userAgent: string;
    clientId: string;
    clientSecret?: string;
    deviceId?: string;
    grantType?: string;
    permanent?: boolean;
    endpointDomain?: string;
  }): Promise<Snoowrap> {
    requiredArg('userAgent');
    requiredArg('clientId');

    return credentialedClientRequest.bind({
      clientId,
      clientSecret,
      // Use `this.prototype.rawRequest` function to allow for custom `rawRequest` method usage in subclasses.
      rawRequest: this.prototype.rawRequest
    } as Snoowrap)({
      method: 'post',
      baseUrl: `https://www.${endpointDomain}/`,
      uri: 'api/v1/access_token',
      form: { grant_type: grantType, device_id: deviceId, duration: permanent ? 'permanent' : 'temporary' }
    }).then(response => {
      if (response.error) {
        throw new errors.RequestError(`API Error: ${response.error} - ${response.error_description}`);
      }
      // Use `new this` instead of `new snoowrap` to ensure that subclass instances can be returned
      const requester = new this({ userAgent, clientId, clientSecret, ...response });
      requester.config({ endpointDomain });
      return requester;
    });
  }

  _newObject<T extends unknown>(objectType: keyof typeof objects, content?: Partial<T>, _hasFetched = false): T {
    return Array.isArray(content) ? content as T : new objects[objectType](content, this, _hasFetched) as T;
  }

  /**
   * Retrieves or modifies the configuration options for this snoowrap instance.
   * @param {object} [options] A map of `{[config property name]: value}`. Note that any omitted config properties will simply
   retain whatever value they had previously. (In other words, if you only want to change one property, you only need to put
   that one property in this parameter. To get the current configuration without modifying anything, simply omit this
   parameter.)
   * @param {string} [options.endpointDomain='reddit.com'] The endpoint where requests should be sent
   * @param {Number} [options.requestDelay=0] A minimum delay, in milliseconds, to enforce between API calls. If multiple
   api calls are requested during this timespan, they will be queued and sent one at a time. Setting this to more than 1000 will
   ensure that reddit's ratelimit is never reached, but it will make things run slower than necessary if only a few requests
   are being sent. If this is set to zero, snoowrap will not enforce any delay between individual requests. However, it will
   still refuse to continue if reddit's enforced ratelimit (600 requests per 10 minutes) is exceeded.
   * @param {Number} [options.requestTimeout=30000] A timeout for all OAuth requests, in milliseconds. If the reddit server
   fails to return a response within this amount of time, the Promise will be rejected with a timeout error.
   * @param {boolean} [options.continueAfterRatelimitError=false] Determines whether snoowrap should queue API calls if
   reddit's ratelimit is exceeded. If set to `true` when the ratelimit is exceeded, snoowrap will queue all further requests,
   and will attempt to send them again after the current ratelimit period expires (which happens every 10 minutes). If set
   to `false`, snoowrap will simply throw an error when reddit's ratelimit is exceeded.
   * @param {Number[]} [options.retryErrorCodes=[502, 503, 504, 522]] If reddit responds to an idempotent request with one of
   these error codes, snoowrap will retry the request, up to a maximum of `max_retry_attempts` requests in total. (These
   errors usually indicate that there was an temporary issue on reddit's end, and retrying the request has a decent chance of
   success.) This behavior can be disabled by simply setting this property to an empty array.
   * @param {Number} [options.maxRetryAttempts=3] See `retryErrorCodes`.
   * @param {boolean} [options.warnings=true] snoowrap may occasionally log warnings, such as deprecation notices, to the
   console. These can be disabled by setting this to `false`.
   * @param {boolean} [options.debug=false] If set to true, snoowrap will print out potentially-useful information for debugging
   purposes as it runs.
   * @param {object} [options.logger=console] By default, snoowrap will log any warnings and debug output to the console.
   A custom logger object may be supplied via this option; it must expose `warn`, `info`, `debug`, and `trace` functions.
   * @param {boolean} [options.proxies=true] Setting this to `false` disables snoowrap's method-chaining feature. This causes
   the syntax for using snoowrap to become a bit heavier, but allows for consistency between environments that support the ES6
   `Proxy` object and environments that don't. This option is a no-op in environments that don't support the `Proxy` object,
   since method chaining is always disabled in those environments. Note, changing this setting must be done before making
   any requests.
   * @returns {object} An updated Object containing all of the configuration values
   * @example
   *
   * r.config({requestDelay: 1000, warnings: false});
   * // sets the request delay to 1000 milliseconds, and suppresses warnings.
   */
  config(options: {
    endpointDomain?: string;
    requestDelay?: number;
    requestTimeout?: number;
    continueAfterRatelimitError?: boolean;
    retryErrorCodes?: number[];
    maxRetryAttempts?: number;
    warnings?: boolean;
    debug?: boolean;
    logger?: typeof console;
    proxies?: boolean;
  } = {}) {
    const invalidKey = Object.keys(options).find(key => !(key in this._config));
    if (invalidKey) {
      throw new TypeError(`Invalid config option '${invalidKey}'`);
    }
    return Object.assign(this._config, options);
  }

  _warn(message: string, ...optionalParams: any[]) {
    if (this._config.warnings) {
      this._config.logger.warn(message, ...optionalParams);
    }
  }

  _debug(message: string, ...optionalParams: any[]) {
    if (this._config.debug) {
      this._config.logger.debug(message, ...optionalParams);
    }
  }

  /**
   * @private
   */
  get _promiseWrap() {
    const promiseWrap = async<T extends unknown>(chain: (() => Promise<T>)[]) => {
      const result: T[] = [];
      let promise = Promise.resolve();

      (chain || []).forEach(func => {
        promise = promise
          .then(func)
          .then(res => {
            result.push(res);
            return;
          });
      })

      return promise.then(() => result);
    };
    return this._config.proxies ? promiseWrap : <T>(value: T) => value;
  }

  /**
   * Gets information on a reddit user with a given name.
   * @param name - The user's username.
   * @returns An unfetched RedditUser object for the requested user.
   * @example
   *
   * r.getUser('not_an_aardvark')
   * // => RedditUser { name: 'not_an_aardvark' }
   * r.getUser('not_an_aardvark').link_karma.then(console.log)
   * // => 6
   */
  getUser(name: string): objects.RedditUser {
    return new RedditUser({ name: (name + '').replace(/^\/?u\//, '') }, this, false);
  }

  /**
   * Gets information on a comment with a given id.
   * @param commentId - The base36 id of the comment.
   * @returns An unfetched Comment object for the requested comment.
   * @example
   *
   * r.getComment('c0b6xx0')
   * // => Comment { name: 't1_c0b6xx0' }
   * r.getComment('c0b6xx0').author.name.then(console.log)
   * // => 'Kharos'
   */
  getComment(commentId: string): Comment {
    return new Comment({ name: addFullnamePrefix(commentId, 't1_') }, this, false);
  }

  /**
   * Gets information on a given subreddit..
   * @param displayName - The name of the subreddit (e.g. 'AskReddit').
   * @returns An unfetched Subreddit object for the requested subreddit.
   * @example
   *
   * r.getSubreddit('AskReddit')
   * // => Subreddit { displayName: 'AskReddit' }
   * r.getSubreddit('AskReddit').created_utc.then(console.log)
   * // => 1201233135
   */
  getSubreddit(displayName: string): Subreddit {
    return new Subreddit({ displayName: displayName.replace(/^\/?r\//, '') }, this, false);
  }

  /**
   * Gets information on a given submission.
   * @param submissionId - The base36 id of the submission.
   * @returns An unfetched Submission object for the requested submission.
   * @example
   *
   * r.getSubmission('2np694')
   * // => Submission { name: 't3_2np694' }
   * r.getSubmission('2np694').title.then(console.log)
   * // => 'What tasty food would be disgusting if eaten over rice?'
   */
  getSubmission(submissionId: string): Submission {
    return new Submission({ name: addFullnamePrefix(submissionId, 't3_') }, this, false);
  }

  /**
   * Gets a private message by ID.
   * @param messageId The base36 ID of the message.
   * @returns An unfetched PrivateMessage object for the requested message.
   * @example
   *
   * r.getMessage('51shnw')
   * // => PrivateMessage { name: 't4_51shnw' }
   * r.getMessage('51shnw').subject.then(console.log)
   * // => 'Example'
   * // See here for a screenshot of the PM in question https://i.gyazo.com/24f3b97e55b6ff8e3a74cb026a58b167.png
   */
  getMessage(messageId: string): objects.PrivateMessage {
    return new PrivateMessage({ name: addFullnamePrefix(messageId, 't4_') }, this, false);
  }

  /**
   * Gets a livethread by ID.
   * @param threadId The base36 ID of the livethread
   * @returns An unfetched LiveThread object
   * @example
   *
   * r.getLivethread('whrdxo8dg9n0')
   * // => LiveThread { id: 'whrdxo8dg9n0' }
   * r.getLivethread('whrdxo8dg9n0').nsfw.then(console.log)
   * // => false
   */
  getLivethread(threadId: string): objects.LiveThread {
    return new LiveThread({ id: addFullnamePrefix(threadId, 'LiveUpdateEvent_')?.slice(16) }, this, false);
  }

  /**
   * Gets information on the requester's own user profile.
   * @returns A RedditUser object corresponding to the requester's profile
   * @example
   *
   * r.getMe().then(console.log);
   * // => RedditUser { is_employee: false, has_mail: false, name: 'snoowrap_testing', ... }
   */
  async getMe(): Promise<RedditUser> {
    return this._get<RedditUser>({ uri: 'api/v1/me' }).then(result => new RedditUser(result, this, true));
  }

  _getMyName(): Promise<string | undefined> {
    return Promise.resolve(this._ownUserInfo ? this._ownUserInfo.name : this.getMe().then(me => me?.name));
  }

  /**
   * Gets a distribution of the requester's own karma distribution by subreddit.
   * @returns A Promise for an object with karma information
   * @example
   *
   * r.getKarma().then(console.log)
   * // => [
   * //  { sr: Subreddit { display_name: 'redditdev' }, comment_karma: 16, link_karma: 1 },
   * //  { sr: Subreddit { display_name: 'programming' }, comment_karma: 2, link_karma: 1 },
   * //  ...
   * // ]
   */
  async getKarma(): Promise<{ sr: Subreddit }[]> {
    return this._get<{ sr: Subreddit }[]>({ uri: 'api/v1/me/karma' });
  }

  /**
   * Gets information on the user's current preferences.
   * @returns A promise for an object containing the user's current preferences
   * @example
   *
   * r.getPreferences().then(console.log)
   * // => { default_theme_sr: null, threaded_messages: true, hide_downs: false, ... }
   */
  async getPreferences() {
    return this._get<{
      default_Theme_sr?: string;
      threaded_messages?: boolean;
      hide_downs?: boolean;
    }>({ uri: 'api/v1/me/prefs' });
  }

  /**
   * Updates the user's current preferences.
   * @param updatedPreferences An object of the form {[some preference name]: 'some value', ...}. Any preference
   * not included in this object will simply retain its current value.
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.updatePreferences({threaded_messages: false, hide_downs: true})
   * // => { default_theme_sr: null, threaded_messages: false,hide_downs: true, ... }
   * // (preferences updated on reddit)
   */
  async updatePreferences(updatedPreferences: Record<string, {
    default_Theme_sr?: string;
    threaded_messages?: boolean;
    hide_downs?: boolean;
  }>) {
    return this._patch<{
      default_Theme_sr?: string;
      threaded_messages?: boolean;
      hide_downs?: boolean;
    }>({ uri: 'api/v1/me/prefs', body: updatedPreferences });
  }

  /**
   * Gets the currently-authenticated user's trophies.
   * @returns A TrophyList containing the user's trophies.
   * @example
   *
   * r.getMyTrophies().then(console.log)
   * // => TrophyList { trophies: [
   * //   Trophy { icon_70: 'https://s3.amazonaws.com/redditstatic/award/verified_email-70.png',
   * //     description: null,
   * //     url: null,
   * //     icon_40: 'https://s3.amazonaws.com/redditstatic/award/verified_email-40.png',
   * //     award_id: 'o',
   * //     id: '16fn29',
   * //     name: 'Verified Email'
   * //   }
   * // ] }
   */
  async getMyTrophies() {
    return this._get({ uri: 'api/v1/me/trophies' });
  }

  /**
   * Gets the list of the currently-authenticated user's friends.
   * @returns A Promise that resolves with a list of friends
   * @example
   *
   * r.getFriends().then(console.log)
   * // => [ [ RedditUser { date: 1457927963, name: 'not_an_aardvark', id: 't2_k83md' } ], [] ]
   */
  async getFriends(): Promise<objects.RedditUser> {
    return this._get<objects.RedditUser>({ uri: 'prefs/friends' });
  }

  /**
   * Gets the list of people that the currently-authenticated user has blocked.
   * @returns A Promise that resolves with a list of blocked users
   * @example
   *
   * r.getBlockedUsers().then(console.log)
   * // => [ RedditUser { date: 1457928120, name: 'actually_an_aardvark', id: 't2_q3519' } ]
   */
  async getBlockedUsers(): Promise<objects.RedditUser> {
    return this._get<objects.RedditUser>({ uri: 'prefs/blocked' });
  }

  /**
   * Determines whether the currently-authenticated user needs to fill out a captcha in order to submit content.
   * @returns A Promise that resolves with a boolean value
   * @example
   *
   * r.checkCaptchaRequirement().then(console.log)
   * // => false
   */
  async checkCaptchaRequirement(): Promise<boolean> {
    return this._get<boolean>({ uri: 'api/needs_captcha' });
  }

  /**
   * Gets the identifier (a hex string) for a new captcha image.
   * @returns A Promise that resolves with a string
   * @example
   *
   * r.getNewCaptchaIdentifier().then(console.log)
   * // => 'o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d'
   */
  async getNewCaptchaIdentifier(): Promise<string> {
    return this._post<{ json: { data: { iden: string } } }>({ uri: 'api/new_captcha', form: { api_type: 'json' } }).then(res => res.json.data.iden);
  }

  /**
   * Gets an image for a given captcha identifier.
   * @param identifier The captcha identifier.
   * @returns A string containing raw image data in PNG format
   * @example
   *
   * r.getCaptchaImage('o5M18uy4mk0IW4hs0fu2GNPdXb1Dxe9d').then(console.log)
   // => (A long, incoherent string representing the image in PNG format)
   */
  async getCaptchaImage(identifier: string): Promise<string> {
    return this._get<string>({ uri: `captcha/${identifier}` });
  }

  /**
   * Gets an array of categories that items can be saved in. (Requires reddit gold)
   * @returns An array of categories
   * @example
   *
   * r.getSavedCategories().then(console.log)
   * // => [ { category: 'cute cat pictures' }, { category: 'interesting articles' } ]
   */
  async getSavedCategories(): Promise<{ category: string }[]> {
    return this._get<{ categories: { category: string; }[] }>({ uri: 'api/saved_categories' }).then(result => result.categories);
  }

  /**
   * Marks a list of submissions as 'visited'.
   * @desc **Note**: This endpoint only works if the authenticated user is subscribed to reddit gold.
   * @param links A list of Submission objects to mark.
   * @returns A Promise that fulfills when the request is complete.
   * @example
   *
   * var submissions = [r.getSubmission('4a9u54'), r.getSubmission('4a95nb')]
   * r.markAsVisited(submissions)
   * // (the links will now appear purple on reddit)
   */
  async markAsVisited(links: Submission[]): Promise<void> {
    // @ts-expect-error
    return this._post<void>({ uri: 'api/store_visits', links: map(links, 'name').join(',') });
  }

  _submit({
    captchaResponse,
    captchaIden,
    kind,
    resubmit = true,
    sendReplies = true,
    crosspostFullname,
    text,
    title,
    url,
    subredditName,
    nsfw,
    spoiler,
    flairId,
    flairText,
    ...options
  }: {
    captchaResponse?: string;
    captchaIden?: string;
    kind: 'link' | 'self' | 'crosspost';
    resubmit?: boolean;
    sendReplies?: boolean;
    crosspostFullname?: string;
    text?: string;
    title?: string;
    url?: string;
    subredditName?: string;
    nsfw?: boolean;
    spoiler?: boolean;
    flairId?: string;
    flairText?: string;
  }): Promise<Submission> {
    return this._post<{ json: { data: { id: string; }; errors: string[]; }}>({
      uri: 'api/submit', form: {
        api_type: 'json', captcha: captchaResponse, iden: captchaIden, sendreplies: sendReplies, sr: subredditName, kind, resubmit,
        crosspost_fullname: crosspostFullname, text, title, url, spoiler, nsfw, flair_id: flairId, flair_text: flairText, ...options
      }
    }).then(pTap(handleJsonErrors(this))).then(result => this.getSubmission(result.json.data.id as string));
  }

  /**
   * Creates a new selfpost on the given subreddit.
   * @param options An object containing details about the submission
   * @param options.subredditName The name of the subreddit that the post should be submitted to
   * @param options.title The title of the submission
   * @param options.text The selftext of the submission
   * @param options.sendReplies Determines whether inbox replies should be enabled for this submission
   * @param options.captchaIden A captcha identifier. This is only necessary if the authenticated account
   requires a captcha to submit posts and comments.
   * @param options.captchaResponse The response to the captcha with the given identifier
   * @returns The newly-created Submission object
   * @example
   *
   * r.submitSelfpost({
   *   subredditName: 'snoowrap_testing',
   *   title: 'This is a selfpost',
   *   text: 'This is the text body of the selfpost'
   * }).then(console.log)
   * // => Submission { name: 't3_4abmsz' }
   * // (new selfpost created on reddit)
   */
  async submitSelfpost(options: { subredditName: string; title: string; text: string; sendReplies?: boolean; captchaIden?: string; captchaResponse?: string; }): Promise<Submission> {
    return this._submit({ ...options, kind: 'self' });
  }

  /**
   * Creates a new link submission on the given subreddit.
   * @param options An object containing details about the submission
   * @param options.subredditName The name of the subreddit that the post should be submitted to
   * @param options.title The title of the submission
   * @param options.url The url that the link submission should point to
   * @param options.sendReplies Determines whether inbox replies should be enabled for this submission
   * @param options.resubmit If this is false and same link has already been submitted to this subreddit in the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @param options.captchaIden A captcha identifier. This is only necessary if the authenticated account requires a captcha to submit posts and comments.
   * @param options.captchaResponse The response to the captcha with the given identifier
   * @returns The newly-created Submission object
   * @example
   *
   * r.submitLink({
   *   subredditName: 'snoowrap_testing',
   *   title: 'I found a cool website!',
   *   url: 'https://google.com'
   * }).then(console.log)
   * // => Submission { name: 't3_4abnfe' }
   * // (new linkpost created on reddit)
   */
  async submitLink(options: { subredditName: string; title: string; url: string; sendReplies?: boolean; resubmit?: boolean; captchaIden?: string; captchaResponse?: string; }): Promise<Submission> {
    return this._submit({ ...options, kind: 'link' });
  }

  /**
   * Creates a new crosspost submission on the given subreddit
   * @desc **NOTE**: To create a crosspost, the authenticated account must be subscribed to the subreddit where
   * the crosspost is being submitted, and that subreddit be configured to allow crossposts.
   * @param {object} options An object containing details about the submission
   * @param {string} options.subredditName The name of the subreddit that the crosspost should be submitted to
   * @param {string} options.title The title of the crosspost
   * @param {(string|Submission)} options.originalPost A Submission object or a post ID for the original post which
   is being crossposted
   * @param {boolean} [options.sendReplies=true] Determines whether inbox replies should be enabled for this submission
   * @param {boolean} [options.resubmit=true] If this is false and same link has already been submitted to this subreddit in
   the past, reddit will return an error. This could be used to avoid accidental reposts.
   * @returns The newly-created Submission object
   * @example
   *
   * await r.submitCrosspost({ title: 'I found an interesting post', originalPost: '6vths0', subredditName: 'snoowrap' })
   */
  async submitCrosspost(options: { subredditName: string; title: string; originalPost: string | Submission; sendReplies?: boolean; resubmit?: boolean; }): Promise<Submission> {
    return this._submit({
      ...options,
      kind: 'crosspost',
      crosspostFullname: options.originalPost instanceof objects.Submission
        ? options.originalPost.name
        : addFullnamePrefix(options.originalPost, 't3_')
    });
  }

  private _getSortedFrontpage<T>(sortType: $TSFIXME, subredditName?: string, options = {}) {
    // Handle things properly if only a time parameter is provided but not the subreddit name
    let opts = options;
    let subName = subredditName;
    if (typeof subredditName === 'object' && isEmpty(omitBy(opts, option => option === undefined))) {
      /* In this case, "subredditName" ends up referring to the second argument, which is not actually a name since the user
      decided to omit that parameter. */
      opts = subredditName;
      subName = undefined;
    }
    // @ts-expect-error
    const parsedOptions = omit({ ...opts, t: opts.time || opts.t }, 'time');
    return this._getListing<T>({ uri: (subName ? `r/${subName}/` : '') + sortType, qs: parsedOptions });
  }

  /**
   * Gets a Listing of hot posts.
   * @param subredditName The subreddit to get posts from. If not provided, posts are fetched from the front page of reddit.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getHot().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('gifs').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'gifs' }, ... },
   * //  ...
   * // ]
   *
   * r.getHot('redditdev', {limit: 1}).then(console.log)
   * // => Listing [
   //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */
  async getHot(subredditName?: string, options?: { limit?: number; }) {
    return this._getSortedFrontpage('hot', subredditName, options);
  }

  /**
   * Gets a Listing of best posts.
   * @param {object} [options={}] Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getBest().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'pics' }, ... },
   * //  Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... },
   * //  ...
   * // ]
   *
   * r.getBest({limit: 1}).then(console.log)
   * // => Listing [
   //   Submission { domain: 'self.redditdev', banned_by: null, subreddit: Subreddit { display_name: 'redditdev' }, ...}
   * // ]
   */
  async getBest(options?: { limit?: number; }) {
    return this._getSortedFrontpage('best', undefined, options);
  }

  /**
   * Gets a Listing of new posts.
   * @param subredditName The subreddit to get posts from. If not provided, posts are fetched from the front page of reddit.
   * @param options Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getNew().then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.Jokes', banned_by: null, subreddit: Subreddit { display_name: 'Jokes' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   *
   */
  async getNew(subredditName: string, options?: { limit?: number; }) {
    return this._getSortedFrontpage('new', subredditName, options);
  }

  /**
   * Gets a Listing of new comments.
   * @param subredditName The subreddit to get comments from. If not provided, posts are fetched from
   the front page of reddit.
   * @param options Options for the resulting Listing
   * @returns A Listing containing the retrieved comments
   * @example
   *
   * r.getNewComments().then(console.log)
   * // => Listing [
   * //  Comment { link_title: 'What amazing book should be made into a movie, but hasn\'t been yet?', ... }
   * //  Comment { link_title: 'How far back in time could you go and still understand English?', ... }
   * // ]
   */
  async getNewComments(subredditName?: string, options?: { limit?: number; }): Promise<objects.Listing<Comment>> {
    return this._getSortedFrontpage<Comment>('comments', subredditName, options);
  }

  /**
   * Get list of content by IDs. Returns a listing of the requested content.
   * @param ids An array of content IDs. Can include the id itself, or a Submission or Comment object can get a post and a comment.
   * @returns A listing of content requested, can be any class fetchable by API. e.g. Comment, Submission.
   * @example
   *
   * r.getContentByIds(['t3_9l9vof','t3_9la341']).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
   *
   * r.getContentByIds([r.getSubmission('9l9vof'), r.getSubmission('9la341')]).then(console.log);
   * // => Listing [
   * //  Submission { approved_at_utc: null, ... }
   * //  Submission { approved_at_utc: null, ... }
   * // ]
  */
  async getContentByIds(ids: (Submission | Comment | string)[]): Promise<objects.Listing<Submission | Comment>> {
    if (!Array.isArray(ids)) {
      throw new TypeError('Invalid argument: Argument needs to be an array.');
    }

    const prefixedIds = ids.map(id => {
      if (id instanceof objects.Submission || id instanceof Comment) {
        return id.name;
      } else if (typeof id === 'string') {
        if (!/t(1|3)_/g.test(id)) {
          throw new TypeError('Invalid argument: Ids need to include Submission or Comment prefix, e.g. t1_, t3_.');
        }
        return id;
      }
      throw new TypeError('Id must be either a string, Submission, or Comment.');
    });

    return this._get<objects.Listing<Submission | Comment>>({ uri: '/api/info', qs: { id: prefixedIds.join(',') } });
  }

  /**
   * Gets a single random Submission.
   * @desc **Note**: This function will not work when snoowrap is running in a browser, because the reddit server sends a
   redirect which cannot be followed by a CORS request.
   * @param subredditName The subreddit to get the random submission. If not provided, the post is fetched from
   the front page of reddit.
   * @returns The retrieved Submission object
   * @example
   *
   * r.getRandomSubmission('aww').then(console.log)
   * // => Submission { domain: 'i.imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'aww' }, ... }
   */
  async getRandomSubmission(subredditName?: string): Promise<Submission> {
    return this._get<Submission>({ uri: `${subredditName ? `r/${subredditName}/` : ''}random` });
  }

  /**
   * Gets a Listing of top posts.
   * @param subredditName The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param options Options for the resulting Listing
   * @param options.time Describes the timespan that posts should be retrieved from. Should be one of
   `hour, day, week, month, year, all`
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getTop({time: 'all', limit: 2}).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, subreddit: Subreddit { display_name: 'funny' }, ... }
   * // ]
   *
   * r.getTop('AskReddit').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  Submission { domain: 'self.AskReddit', banned_by: null, subreddit: Subreddit { display_name: 'AskReddit' }, ... },
   * //  ...
   * // ]
   */
  async getTop(subredditName?: string, options?: { time?: string; }): Promise<objects.Listing<Submission>> {
    return this._getSortedFrontpage('top', subredditName, options);
  }

  /**
   * Gets a Listing of controversial posts.
   * @param subredditName The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param options Options for the resulting Listing
   * @param options.time Describes the timespan that posts should be retrieved from. Should be one of
   `hour, day, week, month, year, all`
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getControversial('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */
  async getControversial(subredditName?: string, options?: { time?: string }): Promise<objects.Listing<Submission>> {
    return this._getSortedFrontpage('controversial', subredditName, options);
  }

  /**
   * Gets a Listing of controversial posts.
   * @param subredditName The subreddit to get posts from. If not provided, posts are fetched from
   the front page of reddit.
   * @param options Options for the resulting Listing
   * @returns A Listing containing the retrieved submissions
   * @example
   *
   * r.getRising('technology').then(console.log)
   * // => Listing [
   * //  Submission { domain: 'thenextweb.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... },
   * //  Submission { domain: 'pcmag.com', banned_by: null, subreddit: Subreddit { display_name: 'technology' }, ... }
   * // ]
   */
  async getRising(subredditName?: string, options?: { limit?: number }): Promise<objects.Listing<Submission>> {
    return this._getSortedFrontpage('rising', subredditName, options);
  }

  /**
   * Gets the authenticated user's unread messages.
   * @param options Options for the resulting Listing
   * @returns A Listing containing unread items in the user's inbox
   * @example
   *
   * r.getUnreadMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */
  async getUnreadMessages(options = {}): Promise<objects.Listing<objects.PrivateMessage | Comment>> {
    return this._getListing({ uri: 'message/unread', qs: options });
  }

  /**
   * Gets the items in the authenticated user's inbox.
   * @param options Filter options. Can also contain options for the resulting Listing.
   * @param options.filter A filter for the inbox items.
   * If provided, it should be one of `unread`, (unread items), `messages` (i.e. PMs), `comments` (comment replies), `selfreply` (selfpost replies), or `mentions` (username mentions).
   * @returns A Listing containing items in the user's inbox
   * @example
   *
   * r.getInbox().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'hi!', was_comment: false, first_message: null, ... },
   * //  Comment { body: 'this is a reply', link_title: 'Yay, a selfpost!', was_comment: true, ... }
   * // ]
   */
  async getInbox({ filter, ...options }: { filter?: 'unraid' | 'messages' | 'comments' | 'selfreply' | 'mentions'; } = {}) {
    // @ts-expect-error
    return this._getListing<(Comment | objects.PrivateMessage)[]>({ uri: `message/${filter || 'inbox'}`, qs: options });
  }

  /**
   * Gets the authenticated user's modmail.
   * @param options Options for the resulting Listing
   * @returns A Listing of the user's modmail
   * @example
   *
   * r.getModmail({limit: 2}).then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: '/u/not_an_aardvark has accepted an invitation to become moderator ... ', ... },
   * //  PrivateMessage { body: '/u/not_an_aardvark has been invited by /u/actually_an_aardvark to ...', ... }
   * // ]
   */
  async getModmail(options = {}): Promise<objects.Listing<objects.PrivateMessage>> {
    return this._getListing({ uri: 'message/moderator', qs: options });
  }

  /**
   * Gets a list of ModmailConversations from the authenticated user's subreddits.
   * @param options Options for the resulting Listing.
   * @returns A Listing containing Subreddits.
   * @example
   *
   * r.getNewModmailConversations({limit: 2}).then(console.log)
   * // => Listing [
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... },
   * //  ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   * // ]
   */
  async getNewModmailConversations(options = {}): Promise<objects.Listing<objects.ModmailConversation>> {
    return this._getListing({
      uri: 'api/mod/conversations', qs: options, _name: 'ModmailConversation', _transform: response => {
        response.after = null;
        response.before = null;
        response.children = [];

        for (const conversation of response.conversationIds) {
          response.conversations[conversation].participant = this._newObject<ModmailConversationAuthor>('ModmailConversationAuthor', {
            ...response.conversations[conversation].participant
          });
          const conversationObjects = objects.ModmailConversation._getConversationObjects(
            response.conversations[conversation],
            response
          );
          const data = {
            ...conversationObjects,
            ...response.conversations[conversation]
          };
          response.children.push(this._newObject('ModmailConversation', data));
        }
        return this._newObject('Listing', response);
      }
    });
  }

  /**
   * Create a new modmail discussion between moderators.
   * @param options
   * @param options.body Body of the discussion.
   * @param options.subject Title or subject.
   * @param options.srName Subreddit name without fullname.
   * @returns The created ModmailConversation.
   * @example
   *
   * r.createModeratorDiscussion({
   *   body: 'test body',
   *   subject: 'test subject',
   *   srName: 'AskReddit'
   * }).then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], subject: 'test subject', ... }
   */
  async createModmailDiscussion({
    body,
    subject,
    srName
  }: {
    body: string;
    subject: string;
    srName: string;
  }): Promise<objects.ModmailConversation> {
    const parsedFromSr = srName.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    // _newObject ignores most of the response, no practical way to parse the returned content yet
    return this._post({
      uri: 'api/mod/conversations', form: {
        body, subject, srName: parsedFromSr
      }
      // @ts-expect-error
    }).then(res => this._newObject<objects.ModmailConversation>('ModmailConversation', { id: res.conversation.id }));
  }

  /**
   * Get a ModmailConversation by its id
   * @param id of the ModmailConversation
   * @returns The requested ModmailConversation
   * @example
   *
   * r.getNewModmailConversation('75hxt').then(console.log)
   * // ModmailConversation { messages: [...], objIds: [...], ... }
   */
  async getNewModmailConversation(id: string): Promise<objects.ModmailConversation> {
    return this._newObject<objects.ModmailConversation>('ModmailConversation', { id });
  }

  /**
   * Marks all conversations in array as read.
   * @param conversations to mark as read
   * @example
   *
   * r.markNewModmailConversationsAsRead(['pics', 'sweden'])
   */
  async markNewModmailConversationsAsRead(conversations: (objects.ModmailConversation | string)[]): Promise<void> {
    const conversationIds = conversations.map(message => addFullnamePrefix(message, ''));
    return this._post({ uri: 'api/mod/conversations/read', form: { conversationIds: conversationIds.join(',') } });
  }

  /**
   * Marks all conversations in array as unread.
   * @param conversations to mark as unread
   * @example
   *
   * r.markNewModmailConversationsAsUnread(['pics', 'sweden'])
   */
  async markNewModmailConversationsAsUnread(conversations: (objects.ModmailConversation | string)[]): Promise<void> {
    const conversationIds = conversations.map(message => addFullnamePrefix(message, ''));
    return this._post({ uri: 'api/mod/conversations/unread', form: { conversationIds: conversationIds.join(',') } });
  }

  /**
   * Gets all moderated subreddits that have new Modmail activated.
   * @returns A Listing of ModmailConversations marked as read.
   * @example
   *
   * r.getNewModmailSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit { display_name: 'tipofmytongue', ... },
   * //  Subreddit { display_name: 'EarthPorn', ... },
   * // ]
   */
  async getNewModmailSubreddits(): Promise<objects.Listing<Subreddit>> {
    // @ts-expect-error
    return this._get({ uri: 'api/mod/conversations/subreddits' }).then(response => {
      // @ts-expect-error
      return Object.values(response.subreddits).map(s => {
        // @ts-expect-error
        return this._newObject('Subreddit', s);
      });
    });
  }

  /**
   * Represents the unread count in a {@link ModmailConversation}. Each of these properties
   * correspond to the amount of unread conversations of that type.
   * @typedef {Object} UnreadCount
   * @property {number} highlighted
   * @property {number} notifications
   * @property {number} archived
   * @property {number} new
   * @property {number} inprogress
   * @property {number} mod
   */

  /**
   * Retrieves an object of unread Modmail conversations for each state.
   * @returns {UnreadCount} unreadCount
   * @example
   *
   * r.getUnreadNewModmailConversationsCount().then(console.log)
   * // => {
   * //  archived: 1,
   * //  appeals: 1,
   * //  highlighted: 0,
   * //  notifications: 0,
   * //  join_requests: 0,
   * //  new: 2,
   * //  inprogress: 5,
   * //  mod: 1,
   * // }
   */
  async getUnreadNewModmailConversationsCount(): Promise<{
    archived: number;
    appeals: number;
    highlighted: number;
    join_requests: number;
    new: number;
    inprogress: number;
    mod: number;
  }> {
    return this._get<{
      archived: number;
      appeals: number;
      highlighted: number;
      join_requests: number;
      new: number;
      inprogress: number;
      mod: number;
    }>({ uri: 'api/mod/conversations/unread/count' });
  }

  /**
   * Mark Modmail conversations as read given the subreddit(s) and state.
   * @param subreddits
   * @param state Selected state to mark as read.
   * @returns A Listing of ModmailConversations marked as read.
   * @example
   *
   * r.bulkReadNewModmail(['AskReddit'], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   *
   * r.bulkReadNewModmail([r.getSubreddit('AskReddit')], 'all').then(console.log)
   * // => Listing [
   * //  ModmailConversation { id: '75hxt' },
   * //  ModmailConversation { id: '75hxg' }
   * // ]
   */
  async bulkReadNewModmail(subreddits: (Subreddit | string)[], state: 'archived' | 'appeals' | 'highlighted' | 'notifications' | 'join_requests' | 'new' | 'inprogress' | 'mod' | 'all'): Promise<objects.Listing<objects.ModmailConversation>> {
    const subredditNames = subreddits.map(s => typeof s === 'string' ? s.replace(/^\/?r\//, '') : s.display_name);
    // @ts-expect-error
    return this._post({
      uri: 'api/mod/conversations/bulk/read', form: {
        entity: subredditNames.join(','),
        state
      }
    }).then(res => {
      return this._newObject('Listing', {
        after: null,
        before: null,
        // @ts-expect-error
        children: res.conversation_ids.map(id => {
          return this._newObject('ModmailConversation', { id });
        })
      });
    });
  }

  /**
   * Gets the user's sent messages.
   * @param options Options for the resulting Listing.
   * @returns A Listing of the user's sent messages.
   * @example
   *
   * r.getSentMessages().then(console.log)
   * // => Listing [
   * //  PrivateMessage { body: 'you have been added as an approved submitter to ...', ... },
   * //  PrivateMessage { body: 'you have been banned from posting to ...' ... }
   * // ]
   */
  async getSentMessages(options = {}): Promise<objects.Listing<objects.PrivateMessage>> {
    return this._getListing({ uri: 'message/sent', qs: options });
  }

  /**
   * Marks all of the given messages as read.
   * @param messages An Array of PrivateMessage or Comment objects. Can also contain strings
   representing message or comment IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname
   prefix such as `t1_` is specified.
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsRead(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsRead(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */
  async markMessagesAsRead(messages: (objects.PrivateMessage | string)[]): Promise<void> {
    const messageIds = messages.map(message => addFullnamePrefix(message, 't4_'));
    return this._post({ uri: 'api/read_message', form: { id: messageIds.join(',') } });
  }

  /**
   * Marks all of the given messages as unread.
   * @param messages An Array of PrivateMessage or Comment objects. Can also contain strings
   representing message IDs. If strings are provided, they are assumed to represent PrivateMessages unless a fullname prefix such
   as `t1_` is included.
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.markMessagesAsUnread(['51shsd', '51shxv'])
   *
   * // To reference a comment by ID, be sure to use the `t1_` prefix, otherwise snoowrap will be unable to distinguish the
   * // comment ID from a PrivateMessage ID.
   * r.markMessagesAsUnread(['t5_51shsd', 't1_d3zhb5k'])
   *
   * // Alternatively, just pass in a comment object directly.
   * r.markMessagesAsRead([r.getMessage('51shsd'), r.getComment('d3zhb5k')])
   */
  async markMessagesAsUnread(messages: (objects.PrivateMessage | string)[]): Promise<void> {
    const messageIds = messages.map(message => addFullnamePrefix(message, 't4_'));
    return this._post({ uri: 'api/unread_message', form: { id: messageIds.join(',') } });
  }

  /**
   * Marks all of the user's messages as read.
   * @desc **Note:** The reddit.com site imposes a ratelimit of approximately 1 request every 10 minutes on this endpoint.
   Further requests will cause the API to return a 429 error.
   * @returns A Promise that resolves when the request is complete
   * @example
   *
   * r.readAllMessages().then(function () {
   *   r.getUnreadMessages().then(console.log)
   * })
   * // => Listing []
   * // (messages marked as 'read' on reddit)
   */
  async readAllMessages(): Promise<void> {
    return this._post({ uri: 'api/read_all_messages' });
  }

  /**
   * Composes a new private message.
   * @param {object} options
   * @param {RedditUser|Subreddit|string} options.to The recipient of the message.
   * @param {string} options.subject The message subject (100 characters max)
   * @param {string} options.text The body of the message, in raw markdown text
   * @param {Subreddit|string} [options.fromSubreddit] If provided, the message is sent as a modmail from the specified subreddit.
   * @param {string} [options.captchaIden] A captcha identifier. This is only necessary if the authenticated account
   requires a captcha to submit posts and comments.
   * @param {string} [options.captchaResponse] The response to the captcha with the given identifier
   * @returns A Promise that fulfills when the request is complete
   * @example
   *
   * r.composeMessage({
   *   to: 'actually_an_aardvark',
   *   subject: "Hi, how's it going?",
   *   text: 'Long time no see'
   * })
   * // (message created on reddit)
   */
  async composeMessage({
    fromSubreddit,
    captchaIden,
    captchaResponse,
    subject,
    text,
    to
  }: {
    to: string | Subreddit | objects.RedditUser;
    subject: string;
    text: string;
    fromSubreddit?: string | Subreddit;
    captchaIden?: string;
    captchaResponse?: string;
  }): Promise<void> {
    let parsedTo: string;
    let parsedFromSr: string | undefined;
    if (to instanceof objects.RedditUser) {
      parsedTo = to.name;
    } else if (to instanceof Subreddit) {
      parsedTo = `/r/${to.display_name}`;
    } else {
      parsedTo = to;
    }

    if (fromSubreddit instanceof Subreddit) {
      parsedFromSr = fromSubreddit.display_name;
    } else if (typeof fromSubreddit === 'string') {
      parsedFromSr = fromSubreddit.replace(/^\/?r\//, ''); // Convert '/r/subreddit_name' to 'subreddit_name'
    }

    return this._post({
      uri: 'api/compose', form: {
        api_type: 'json', captcha: captchaResponse, iden: captchaIden, from_sr: parsedFromSr, subject, text, to: parsedTo
      }
    }).then(pTap(handleJsonErrors(this))).then(() => {});
  }

  /**
   * Gets a list of all oauth scopes supported by the reddit API.
   * @desc **Note**: This lists every single oauth scope. To get the scope of this requester, use the `scope` property instead.
   * @returns An object containing oauth scopes.
   * @example
   *
   * r.getOauthScopeList().then(console.log)
   * // => {
   * //  creddits: {
   * //    description: 'Spend my reddit gold creddits on giving gold to other users.',
   * //    id: 'creddits',
   * //    name: 'Spend reddit gold creddits'
   * //  },
   * //  modcontributors: {
   * //    description: 'Add/remove users to approved submitter lists and ban/unban or mute/unmute users from ...',
   * //    id: 'modcontributors',
   * //    name: 'Approve submitters and ban users'
   * //  },
   * //  ...
   * // }
   */
  async getOauthScopeList(): Promise<Record<string, {
    description: string;
    id: string;
    name: string;
  }>> {
    return this._get<Record<string, {
      description: string;
      id: string;
      name: string;
    }>>({ uri: 'api/v1/scopes' });
  }

  /**
   * Conducts a search of reddit submissions.
   * @param {object} options Search options. Can also contain options for the resulting Listing.
   * @param {string} options.query The search query
   * @param {string} [options.time] Describes the timespan that posts should be retrieved from. One of
   `hour, day, week, month, year, all`
   * @param {Subreddit|string} [options.subreddit] The subreddit to conduct the search on.
   * @param {boolean} [options.restrictSr=true] Restricts search results to the given subreddit
   * @param {string} [options.sort] Determines how the results should be sorted. One of `relevance, hot, top, new, comments`
   * @param {string} [options.syntax='plain'] Specifies a syntax for the search. One of `cloudsearch, lucene, plain`
   * @returns A Listing containing the search results.
   * @example
   *
   * r.search({
   *   query: 'Cute kittens',
   *   subreddit: 'aww',
   *   sort: 'top'
   * }).then(console.log)
   * // => Listing [
   * //  Submission { domain: 'i.imgur.com', banned_by: null, ... },
   * //  Submission { domain: 'imgur.com', banned_by: null, ... },
   * //  ...
   * // ]
   */
  async search(options: {
    query: string;
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    subreddit?: Subreddit | string;
    restrictSr?: boolean;
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
  }): Promise<objects.Listing<Submission>> {
    if (options.subreddit instanceof Subreddit) {
      options.subreddit = options.subreddit.display_name;
    }
    defaults(options, { restrictSr: true, syntax: 'plain' });
    const parsedQuery = omit(
      { ...options, t: options.time, q: options.query, restrict_sr: options.restrictSr },
      ['time', 'query']
    );
    return this._getListing({ uri: `${options.subreddit ? `r/${options.subreddit}/` : ''}search`, qs: parsedQuery });
  }

  /**
   * Searches for subreddits given a query.
   * @param options
   * @param options.query A search query (50 characters max)
   * @param options.exact Determines whether the results should be limited to exact matches.
   * @param options.includeNsfw Determines whether the results should include NSFW subreddits.
   * @returns An Array containing subreddit names
   * @example
   *
   * r.searchSubredditNames({query: 'programming'}).then(console.log)
   * // => [
   * //  'programming',
   * //  'programmingcirclejerk',
   * //  'programminghorror',
   * //  ...
   * // ]
   */
  async searchSubredditNames({ query, exact = false, includeNsfw = true }: { query: string; exact?: boolean; includeNsfw?: boolean; }): Promise<string[]> {
    return this._post<{ names: string[]; }>({ uri: 'api/search_reddit_names', qs: { exact, include_over_18: includeNsfw, query } }).then(result => result.names);
  }

  _createOrEditSubreddit({
    allow_images = true,
    allow_top = true,
    captcha,
    captcha_iden,
    collapse_deleted_comments = false,
    comment_score_hide_mins = 0,
    description,
    exclude_banned_modqueue = false,
    'header-title': header_title,
    hide_ads = false,
    lang = 'en',
    link_type = 'any',
    name,
    over_18 = false,
    public_description,
    public_traffic = false,
    show_media = false,
    show_media_preview = true,
    spam_comments = 'high',
    spam_links = 'high',
    spam_selfposts = 'high',
    spoilers_enabled = false,
    sr,
    submit_link_label = '',
    submit_text_label = '',
    submit_text = '',
    suggested_comment_sort = 'confidence',
    title,
    type = 'public',
    wiki_edit_age,
    wiki_edit_karma,
    wikimode = 'modonly',
    ...otherKeys
  }: {
    allow_images?: boolean;
    allow_top?: boolean;
    captcha?: string;
    captcha_iden?: string;
    collapse_deleted_comments?: boolean;
    comment_score_hide_mins?: number;
    description?: string;
    exclude_banned_modqueue?: boolean;
    "header-title"?: string;
    hide_ads?: boolean;
    lang?: string;
    link_type?: string;
    name?: string;
    over_18?: boolean;
    public_description?: string;
    public_traffic?: boolean;
    show_media?: boolean;
    show_media_preview?: boolean;
    spam_comments?: SpamLevels;
    spam_links?: SpamLevels;
    spam_selfposts?: SpamLevels;
    spoilers_enabled?: boolean;
    sr?: string;
    submit_link_label?: string;
    submit_text_label?: string;
    submit_text?: string;
    suggested_comment_sort?: CommentSort;
    title?: string;
    type?: SubredditType;
    wiki_edit_age?: number;
    wiki_edit_karma?: number;
    wikimode?: string;
  }): Promise<Subreddit> {
    return this._post({
      uri: 'api/site_admin', form: {
        allow_images, allow_top, api_type: 'json', captcha, collapse_deleted_comments, comment_score_hide_mins, description,
        exclude_banned_modqueue, 'header-title': header_title, hide_ads, iden: captcha_iden, lang, link_type, name,
        over_18, public_description, public_traffic, show_media, show_media_preview, spam_comments, spam_links,
        spam_selfposts, spoilers_enabled, sr, submit_link_label, submit_text, submit_text_label, suggested_comment_sort,
        title, type, wiki_edit_age, wiki_edit_karma, wikimode,
        ...otherKeys
      }
    // @ts-expect-error
    }).then(handleJsonErrors(this.getSubreddit(name || sr)));
  }

  /**
   * Creates a new subreddit.
   * @param {object} options
   * @param {string} options.name The name of the new subreddit
   * @param {string} options.title The text that should appear in the header of the subreddit
   * @param {string} options.public_description The text that appears with this subreddit on the search page, or on the blocked-access page if this subreddit is private. (500 characters max)
   * @param {string} options.description The sidebar text for the subreddit. (5120 characters max)
   * @param {string} [options.submit_text=''] The text to show below the submission page (1024 characters max)
   * @param {boolean} [options.hide_ads=false] Determines whether ads should be hidden on this subreddit. (This is only allowed for gold-only subreddits.)
   * @param {string} [options.lang='en'] The language of the subreddit (represented as an IETF language tag)
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
   * @param {boolean} [options.over_18=false] Determines whether this subreddit should be classified as NSFW
   * @param {boolean} [options.allow_top=true] Determines whether the new subreddit should be able to appear in /r/all and trending subreddits
   * @param {boolean} [options.show_media=false] Determines whether image thumbnails should be enabled on this subreddit
   * @param {boolean} [options.show_media_preview=true] Determines whether media previews should be expanded by default on this subreddit
   * @param {boolean} [options.allow_images=true] Determines whether image uploads and links to image hosting sites should be enabled on this subreddit
   * @param {boolean} [options.exclude_banned_modqueue=false] Determines whether posts by site-wide banned users should be excluded from the modqueue.
   * @param {boolean} [options.public_traffic=false] Determines whether the /about/traffic page for this subreddit should be viewable by anyone.
   * @param {boolean} [options.collapse_deleted_comments=false] Determines whether deleted and removed comments should be collapsed by default
   * @param {string} [options.suggested_comment_sort=undefined] The suggested comment sort for the subreddit. This should be one of `confidence, top, new, controversial, old, random, qa`.If left blank, there will be no suggested sort, which means that users will see the sort method that is set in their own preferences (usually `confidence`.)
   * @param {boolean} [options.spoilers_enabled=false] Determines whether users can mark their posts as spoilers
   * @returns A Promise for the newly-created subreddit object.
   * @example
   *
   * r.createSubreddit({
   *   name: 'snoowrap_testing2',
   *   title: 'snoowrap testing: the sequel',
   *   public_description: 'thanks for reading the snoowrap docs!',
   *   description: 'This text will go on the sidebar',
   *   type: 'private'
   * }).then(console.log)
   * // => Subreddit { display_name: 'snoowrap_testing2' }
   * // (/r/snoowrap_testing2 created on reddit)
   */
  async createSubreddit(options: {
    name: string;
    title: string;
    public_description: string;
    description: string;
    submit_text?: string;
    hide_ads?: boolean;
    lang?: string;
    type?: SubredditType;
    link_type?: 'any' | 'link' | 'self';
  }) {
    return this._createOrEditSubreddit(options);
  }

  /**
   * Gets a list of subreddits that the currently-authenticated user is subscribed to.
   * @param options Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getSubscriptions({limit: 2}).then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'gadgets',
   * //    title: 'reddit gadget guide',
   * //    ...
   * //  },
   * //  Subreddit {
   * //    display_name: 'sports',
   * //    title: 'the sportspage of the Internet',
   * //    ...
   * //  }
   * // ]
   */
  async getSubscriptions(options?: Record<string, unknown>): Promise<objects.Listing<Subreddit>> {
    return this._getListing<Subreddit>({ uri: 'subreddits/mine/subscriber', qs: options });
  }

  /**
   * Gets a list of subreddits in which the currently-authenticated user is an approved submitter.
   * @param options Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getContributorSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   *
   */
  async getContributorSubreddits(options?: Record<string, unknown>) {
    return this._getListing<Subreddit>({ uri: 'subreddits/mine/contributor', qs: options });
  }

  /**
   * Gets a list of subreddits in which the currently-authenticated user is a moderator.
   * @param options Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getModeratedSubreddits().then(console.log)
   * // => Listing [
   * //  Subreddit {
   * //    display_name: 'snoowrap_testing',
   * //    title: 'snoowrap',
   * //    ...
   * //  }
   * // ]
   */
  async getModeratedSubreddits(options?: Record<string, unknown>) {
    return this._getListing<Subreddit>({ uri: 'subreddits/mine/moderator', qs: options });
  }

  /**
   * Searches subreddits by title and description.
   * @param options Options for the search. May also contain Listing parameters.
   * @param options.query The search query
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.searchSubreddits({query: 'cookies'}).then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  async searchSubreddits(options: { query: string }) {
    return this._getListing<Subreddit>({ uri: 'subreddits/search', qs: { q: options.query } });
  }

  /**
   * Gets a list of subreddits, arranged by popularity.
   * @param options Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getPopularSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  async getPopularSubreddits(options?: { limit?: number }) {
    return this._getListing<Subreddit>({ uri: 'subreddits/popular', qs: options });
  }

  /**
   * Gets a list of subreddits, arranged by age.
   * @param options Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getNewSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  async getNewSubreddits(options?: $TSFIXME) {
    return this._getListing<Subreddit>({ uri: 'subreddits/new', qs: options });
  }

  /**
   * Gets a list of gold-exclusive subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getGoldSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  async getGoldSubreddits(options?: $TSFIXME) {
    return this._getListing<Subreddit>({ uri: 'subreddits/gold', qs: options });
  }

  /**
   * Gets a list of default subreddits.
   * @param {object} [options] Options for the resulting Listing
   * @returns A Listing containing Subreddits
   * @example
   *
   * r.getDefaultSubreddits().then(console.log)
   * // => Listing [ Subreddit { ... }, Subreddit { ... }, ...]
   */
  async getDefaultSubreddits(options?: $TSFIXME) {
    return this._getListing<Subreddit>({ uri: 'subreddits/default', qs: options });
  }

  /**
   * Checks whether a given username is available for registration
   * @desc **Note:** This function will not work when snoowrap is running in a browser, due to an issue with reddit's CORS
   settings.
   * @param {string} name The username in question
   * @returns A Promise that fulfills with a Boolean (`true` or `false`)
   * @example
   *
   * r.checkUsernameAvailability('not_an_aardvark').then(console.log)
   * // => false
   * r.checkUsernameAvailability('eqwZAr9qunx7IHqzWVeF').then(console.log)
   * // => true
   */
  async checkUsernameAvailability(name: string): Promise<boolean> {
    // The oauth endpoint listed in reddit's documentation doesn't actually work, so just send an unauthenticated request.
    return unauthenticatedRequest.bind(this)({ uri: 'api/username_available.json', qs: { user: name } });
  }

  /**
   * Creates a new LiveThread.
   * @param options
   * @param options.title The title of the livethread (100 characters max)
   * @param options.description A descriptions of the thread. 120 characters max
   * @param options.resources Information and useful links related to the thread. 120 characters max
   * @param options.nsfw Determines whether the thread is Not Safe For Work
   * @returns A Promise that fulfills with the new LiveThread when the request is complete
   * @example
   *
   * r.createLivethread({title: 'My livethread'}).then(console.log)
   * // => LiveThread { id: 'wpimncm1f01j' }
   */
  async createLivethread({ title, description, resources, nsfw = false }: { title: string; description?: string; resources?: string; nsfw?: boolean; }) {
    return this._post<{ json: { data: { id: string }; errors: string[]; } }>({
      uri: 'api/live/create',
      form: { api_type: 'json', description, nsfw, resources, title }
    }).then(pTap<{ json: { data: { id: string }; errors: string[]; } }>(handleJsonErrors(this))).then(result => this.getLivethread(result.json.data.id));
  }

  /**
   * Gets the "happening now" LiveThread, if it exists
   * @desc This is the LiveThread that is occasionally linked at the top of reddit.com, relating to current events.
   * @returns A Promise that fulfills with the "happening now" LiveThread if it exists, or rejects with a 404 error
   otherwise.
   * @example r.getCurrentEventsLivethread().then(thread => thread.stream.on('update', console.log))
   */
  async getStickiedLivethread(): Promise<any> {
    return this._get<objects.LiveThread>({ uri: 'api/live/happening_now' }).then(thread => thread.stream);
  }

  /**
   * Gets the user's own multireddits.
   * @returns A Promise for an Array containing the requester's MultiReddits.
   * @example
   *
   * r.getMyMultireddits().then(console.log)
   * => [ MultiReddit { ... }, MultiReddit { ... }, ... ]
   */
  async getMyMultireddits(): Promise<objects.MultiReddit> {
    return this._get<objects.MultiReddit>({ uri: 'api/multi/mine', qs: { expand_srs: true } });
  }

  /**
   * Creates a new multireddit.
   * @param options
   * @param options.name The name of the new multireddit. 50 characters max
   * @param options.description A description for the new multireddit, in markdown.
   * @param options.subreddits An Array of Subreddit objects (or subreddit names) that this multireddit should compose of
   * @param options.visibility The multireddit's visibility setting. One of `private`, `public`, `hidden`.
   * @param options.icon_name One of `art and design`, `ask`, `books`, `business`, `cars`, `comics`,
   `cute animals`, `diy`, `entertainment`, `food and drink`, `funny`, `games`, `grooming`, `health`, `life advice`, `military`,
   `models pinup`, `music`, `news`, `philosophy`, `pictures and gifs`, `science`, `shopping`, `sports`, `style`, `tech`,
   `travel`, `unusual stories`, `video`, `None`
   * @param {string} [options.key_color='#000000'] A six-digit RGB hex color, preceded by '#'
   * @param {string} [options.weighting_scheme='classic'] One of `classic`, `fresh`
   * @returns A Promise for the newly-created MultiReddit object
   * @example
   *
   * r.createMultireddit({
   *   name: 'myMulti',
   *   description: 'An example multireddit',
   *   subreddits: ['snoowrap', 'snoowrap_testing']
   * }).then(console.log)
   * => MultiReddit { display_name: 'myMulti', ... }
   */
  async createMultireddit({
    name, description, subreddits, visibility = 'private', iconName = '', keyColor = '#000000',
    weightingScheme = 'classic'
  }: {
    name: string;
    description: string;
    subreddits: (Subreddit | string)[];
    visibility?: SubredditType;
    iconName?: 'art and design' | 'ask' | 'books' | 'business' | 'cars' | 'comics' | 'cute animals' | 'diy' | 'entertainment' | 'food and drink' | 'funny' | 'games' | 'grooming' | 'health' | 'life advice' | 'military' | 'models pinup' | 'music' | 'news' | 'philosophy' | 'pictures and gifs' | 'science' | 'shopping' | 'sports' | 'style' | 'tech' | 'travel' | 'unusual stories' | 'video' | '';
    keyColor?: string;
    weightingScheme?: 'classic' | 'fresh';
  }) {
    return this._post({
      uri: 'api/multi', form: {
        model: JSON.stringify({
          display_name: name,
          description_md: description,
          icon_name: iconName,
          key_color: keyColor,
          subreddits: subreddits.map(sub => ({ name: typeof sub === 'string' ? sub : sub.display_name })),
          visibility,
          weighting_scheme: weightingScheme
        })
      }
    });
  }

  private _revokeToken(token?: string) {
    return credentialedClientRequest.bind(this)({ uri: 'api/v1/revoke_token', form: { token }, method: 'post' });
  }

  /**
   * Invalidates the current access token.
   * @returns A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. If the
   current requester was supplied with a refresh token, it will automatically create a new access token if any more requests
   are made after this one.
   * @example r.revokeAccessToken();
   */
  async revokeAccessToken() {
    // @ts-expect-error
    return this._revokeToken(this.accessToken).then(() => {
      this.accessToken = null;
      this.tokenExpiration = null;
    });
  }

  /**
   * Invalidates the current refresh token.
   * @returns A Promise that fulfills when this request is complete
   * @desc **Note**: This can only be used if the current requester was supplied with a `client_id` and `client_secret`. All
   access tokens generated by this refresh token will also be invalidated. This effectively de-authenticates the requester and
   prevents it from making any more valid requests. This should only be used in a few cases, e.g. if this token has
   been accidentally leaked to a third party.
   * @example r.revokeRefreshToken();
   */
  async revokeRefreshToken() {
    // @ts-expect-error
    return this._revokeToken(this.refreshToken).then(() => {
      this.refreshToken = null;
      this.accessToken = null; // Revoking a refresh token also revokes any associated access tokens.
      this.tokenExpiration = null;
    });
  }

  /**
   * @private
   */
  async _selectFlair({
    flairTemplateId,
    link,
    name,
    text,
    subredditName
  }: $TSFIXME) {
    if (!flairTemplateId) {
      throw new errors.InvalidMethodCallError('No flair template ID provided');
    }
    return Promise.resolve(subredditName).then(subName => {
      return this._post({ uri: `r/${subName}/api/selectflair`, form: { api_type: 'json', flair_template_id: flairTemplateId, link, name, text } });
    });
  }

  async _assignFlair({ cssClass, link, name, text, subredditName }: { cssClass: string; link: string; name: string; text: string; subredditName: string; }) {
    // @ts-expect-error
    return this._promiseWrap(Promise.resolve(subredditName).then(displayName => {
      return this._post({ uri: `r/${displayName}/api/flair`, form: { api_type: 'json', name, text, link, css_class: cssClass } });
    }));
  }

  /**
   * @private
   */
  _populate(responseTree: { kind: keyof typeof KINDS, data: $TSFIXME }): $TSFIXME {
    if (typeof responseTree === 'object' && responseTree !== null) {
      // Map {kind: 't2', data: {name: 'some_username', ... }} to a RedditUser (e.g.) with the same properties
      if (Object.keys(responseTree).length === 2 && responseTree.kind && responseTree.data) {
        // @ts-expect-error
        return this._newObject(KINDS[responseTree.kind] || 'RedditContent', this._populate(responseTree.data), true);
      }
      const result = (Array.isArray(responseTree) ? map : mapValues as $TSFIXME)(responseTree, (value: $TSFIXME, key: $TSFIXME) => {
        // Maps {author: 'some_username'} to {author: RedditUser { name: 'some_username' } }
        if (value !== null && USER_KEYS.has(key)) {
          return this._newObject<objects.RedditUser>('RedditUser', { name: value });
        }
        if (value !== null && SUBREDDIT_KEYS.has(key)) {
          return this._newObject<Subreddit>('Subreddit', { display_name: value });
        }
        return this._populate(value);
      });
      if (result.length === 2 && result[0] instanceof objects.Listing
        && result[0][0] instanceof objects.Submission && result[1] instanceof objects.Listing) {
        if (result[1]._more && !result[1]._more.link_id) {
          result[1]._more.link_id = (result[0][0] as $TSFIXME).name;
        }
        result[0][0].comments = result[1];
        return result[0][0];
      }
      return result;
    }
    return responseTree;
  }

  /**
   * @private
   */
  _getListing<T>({ uri, qs = {}, ...options }: { uri: string; qs?: Record<string, unknown>; _name?: string; _transform?: $TSFIXME }): objects.Listing<T> {
    /* When the response type is expected to be a Listing, add a `count` parameter with a very high number.
    This ensures that reddit returns a `before` property in the resulting Listing to enable pagination.
    (Aside from the additional parameter, this function is equivalent to snoowrap.prototype._get) */
    const mergedQuery = { count: 9999, ...qs };
    return qs.limit || !isEmpty(options)
      // @ts-expect-error
      ? this._newObject<Listing>('Listing', { _query: mergedQuery, _uri: uri, ...options }).fetchMore(qs.limit || MAX_LISTING_ITEMS)
      /* This second case is used as a fallback in case the endpoint unexpectedly ends up returning something other than a
      Listing (e.g. Submission#getRelated, which used to return a Listing but no longer does due to upstream reddit API
      changes), in which case using fetch_more() as above will throw an error.

      This fallback only works if there are no other meta-properties provided for the Listing, such as _transform. If there are
      other meta-properties,  the function will still end up throwing an error, but there's not really any good way to handle it
      (predicting upstream changes can only go so far). More importantly, in the limited cases where it's used, the fallback
      should have no effect on the returned results */
      : this._get({ uri, qs: mergedQuery }).then(listing => {
        if (Array.isArray(listing)) {
          listing.filter(item => item.constructor._name === 'Comment').forEach(addEmptyRepliesListing);
        }
        return listing;
      });
  }

  /**
   * @private
   */
  async _get<T extends unknown>(options: Omit<Parameters<typeof oauthRequest>[0], 'method'>) {
    return this._promiseWrap(oauthRequest.bind(this)({ ...options, method: 'get' }) as $TSFIXME) as T;
  }

  /**
   * @private
   */
  async _post<T extends unknown>(options: Omit<Parameters<typeof oauthRequest>[0], 'method'>) {
    return this._promiseWrap(oauthRequest.bind(this)({ ...options, method: 'post' }) as $TSFIXME) as T;
  }

  /**
   * @private
   */
  async _put<T extends unknown>(options: Omit<Parameters<typeof oauthRequest>[0], 'method'>) {
    return this._promiseWrap(oauthRequest.bind(this)({ ...options, method: 'put' }) as $TSFIXME) as T;
  }

  /**
   * @private
   */
  async _patch<T extends unknown>(options: Omit<Parameters<typeof oauthRequest>[0], 'method'>) {
    return this._promiseWrap(oauthRequest.bind(this)({ ...options, method: 'patch' }) as $TSFIXME) as T;
  }

  /**
   * @private
   */
  async _delete<T extends unknown>(options: Omit<Parameters<typeof oauthRequest>[0], 'method'>) {
    return this._promiseWrap(oauthRequest.bind(this)({ ...options, method: 'delete' }) as $TSFIXME) as T;
  }

  /**
  * Sends an HTTP request
  * 
  * **Note**: This function is called internally whenever snoowrap makes a request. You generally should not call this
  * function directly; use {@link snoowrap#oauthRequest} or another snoowrap function instead.
  *
  * This method allows snoowrap's request behavior to be customized via subclassing. If you create a snoowrap subclass and shadow
  * this method, all requests from snoowrap will pass through it.
  *
  * To ensure that all other snoowrap methods work correctly, the API for a shadowed version of this method must match the API for
  * the original `makeRequest` method. This method is based on the API of the
  * [request-promise](https://www.npmjs.com/package/request-promise) library, so if you do create a subclass, it might be helpful
  * to use `request-promise` internally. This will ensure that the API works correctly, so that you don't have to reimplement this
  * function's API from scratch.
  *
  * @param {object} options Options for the request
  * @param {boolean} options.json If `true`, the `Content-Type: application/json` header is added, and the response body will be
  * parsed as JSON automatically.
  * @param {string} options.baseUrl The base URL that a request should be sent to
  * @param {string} options.uri The uri that a request should be sent to, using the provided `baseUrl`.
  * @param {string} options.method='GET' Method for the request
  * @param {object} options.headers Headers for the request
  * @param {object} [options.qs] Querystring parameters for the request
  * @param {object} [options.form] Form data for the request. If provided, the `Content-Type: application/x-www-form-urlencoded`
  * header is set, and the provided object is serialized into URL-encoded form data in the request body.
  * @param {object} [options.formData] Multipart form data for the request. If provided, the `Content-Type: multipart/form-data`
  * header is set, and the provided object is serialized as multipart form data.
  * @param {object} [options.body] The body of the request. Should be converted to a string with JSON.stringify(). This is ignored
  * for GET requests, or of `options.form` or `options.formData` are provided.
  * @param {Function} [options.transform] A function that is called before the response Promise fulfills. Accepts two parameters:
  * `response.body` and `response`. This function should be called regardless of the status code of the response, and the returned
  * Promise from `makeRequest` should fulfill with its return value.
  * @param {boolean} [options.resolveWithFullResponse=false] If `true`, a Promise for the entire response is returned. If `false`,
  * a Promise for only the response body is returned. This is ignored if an `options.transform` function is provided.
  * @returns A Promise for a response object. Depending on `options.transform` and `options.resolveWithFullResponse`,
  * the Promise should settle with either the response object itself, the body of the response, or the value returned by
  * `options.transform`. The Promise should be fulfilled if the status code is between 200 and 299, inclusive, and reject
  * otherwise. (If a redirect is returned from the server, the function should follow the redirect if possible, otherwise reject
  * with an error.) A response object has 4 properties: `statusCode` (number) the status code of the response, `body` (object)
  * the body of the response, `headers` (object) the parsed response headers, and `request` (object) an object of the form
  * `{method: 'GET', uri: {href: 'https://oauth.reddit.com/full/url'}}` representing information about the original request.
  * 
  * @example
  *
  * const snoowrap = require('snoowrap');
  *
  * class SnoowrapSubclass extends snoowrap {
  *   rawRequest(options) {
  *     // do custom behavior with `options` if you want, then call the regular rawRequest function
  *     console.log(`made a request with options:`);
  *     console.log(options);
  *     return super.rawRequest(options)
  *   }
  * }
  *
  * const request = require('request-promise');
  *
  * class AnotherSnoowrapSubclass extends snoowrap {
  *   rawRequest(options) {
  *     // send all requests through a proxy
  *     return request(Object.assign(options, {proxy: 'https://example.com'}))
  *   }
  * }
  */
  async rawRequest(options: request.RequiredUriUrl & requestPromise.RequestPromiseOptions) {
    return requestPromise.defaults({ gzip: true })(options);
  }
}


// const classFuncDescriptors = {configurable: true, writable: true};

/* Add the request_handler functions (oauth_request, credentialed_client_request, etc.) to the snoowrap prototype. Use
Object.defineProperties to ensure that the properties are non-enumerable. */
// Object.defineProperties(snoowrap.prototype, mapValues(requestHandler, func => ({value: func, ...classFuncDescriptors})));

/* `objects` will be an object containing getters for each content type, due to the way objects are exported from
objects/index.js. To unwrap these getters into direct properties, use lodash.mapValues with an identity function. */
// snoowrap.objects = mapValues(objects, value => value);

// forOwn(KINDS, value => {
//   objects[value] = objects[value] || class extends objects.RedditContent {};
//   Object.defineProperty(snoowrap.objects[value], '_name', {value, configurable: true});
// });