import {includes, merge} from 'lodash';
import {IDEMPOTENT_HTTP_VERBS, MAX_TOKEN_LATENCY} from './constants';
import {rateLimitWarning, RateLimitError} from './errors';
import { snoowrap } from './snoowrap';
import { $TSFIXME } from './ts-fix-me';

const delay = async (ms: number) => new Promise<void>(resolve => {
  setTimeout(() => {
    resolve();
  }, ms);
});

/**
* @summary Sends an oauth-authenticated request to the reddit server, and returns the server's response.
* @desc **Note**: While this function primarily exists for internal use, it is exposed and considered a stable feature.
However, keep in mind that there are usually better alternatives to using this function. For instance, this
function can be used to send a POST request to the 'api/vote' endpoint in order to upvote a comment, but it's generally
easier to just use snoowrap's [upvote function]{@link VoteableContent#upvote}.
*
* If you're using this function to access an API feature/endpoint that is unsupported by snoowrap, please consider [creating an
issue for it](https://github.com/not-an-aardvark/snoowrap/issues) so that the functionality can be added to snoowrap more
directly.
* @param {object} options Options for the request. For documentation on these options, see the
[Request API](https://www.npmjs.com/package/request). Supported options include `uri`, `qs`, `form`, `headers`, `method`,
`auth`, and `body`. A default `baseUrl` parameter of `this.config().endpoint_domain` is internally included by default, so it
is recommended that a `uri` parameter be used, rather than a `url` parameter with a
domain name.
* @returns A Promise that fulfills with reddit's response.
* @example
*
* r.oauthRequest({uri: '/user/spez/about', method: 'get'}).then(console.log)
* // => RedditUser { name: 'spez', link_karma: 9567, ... }
*
* // Note that this is equivalent to:
* r.getUser('spez').fetch().then(console.log)
*
* // ######
*
* r.oauthRequest({uri: '/api/vote', method: 'post', form: {dir: 1, id: 't3_4fzg2k'}})
* // equivalent to:
* r.getSubmission('4fzg2k').upvote()
*
* // ######
*
* r.oauthRequest({uri: '/top', method: 'get', qs: {t: 'all'}})
* // equivalent to:
* r.getTop({time: 'all'})
*/
export async function oauthRequest (this: snoowrap, options: {
  uri: string;
  qs?: Record<string, unknown>;
  form?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  method: 'get' | 'post' | 'delete' | 'put' | 'patch';
  auth?: $TSFIXME;
  body?: $TSFIXME;
}, attempts = 1) {
  return Promise.resolve()
    .then(() => _awaitRatelimit.bind(this)())
    .then(() => _awaitRequestDelay.bind(this)())
    .then(() => _awaitExponentialBackoff(attempts))
    .then(() => updateAccessToken.bind(this)())
    .then(token => {
      return this.rawRequest(merge({
        json: true,
        headers: {'user-agent': this.userAgent},
        baseUrl: `https://oauth.${this._config.endpointDomain}`,
        qs: {raw_json: 1},
        auth: {bearer: token},
        resolveWithFullResponse: true,
        timeout: this._config.requestTimeout,
        transform: (body, response) => {
          if (Object.prototype.hasOwnProperty.call(response.headers, 'x-ratelimit-remaining')) {
            this.ratelimitRemaining = +response.headers['x-ratelimit-remaining'];
            this.ratelimitExpiration = Date.now() + (response.headers['x-ratelimit-reset'] * 1000);
          }
          this._debug(
            `Received a ${response.statusCode} status code from a \`${response.request.method}\` request`,
            `sent to ${response.request.uri.href}. ratelimitRemaining: ${this.ratelimitRemaining}`
          );
          return response;
        }
      }, options));
    }).then(response => {
      const populated = this._populate(response.body);
      if (populated && populated.constructor._name === 'Listing') {
        populated._setUri(response.request.uri.href);
      }
      return populated;
      // @ts-expect-error
    }).catch(...this._config.retryErrorCodes.map(retryCode => ({statusCode: retryCode})), e => {
      if (!includes(IDEMPOTENT_HTTP_VERBS, e.response.request.method) || attempts >= this._config.maxRetryAttempts) {
        throw e;
      }
      /* If the error's status code is in the user's configured `retryStatusCodes` and this request still has attempts
      remaining, retry this request and increment the `attempts` counter. */
      this._warn(
        `Received status code ${e.statusCode} from reddit.`,
        `Retrying request (attempt ${attempts + 1}/${this._config.maxRetryAttempts})...`
      );
      return oauthRequest.bind(this)(options, attempts + 1);
    }).catch((error: unknown) => {
      if ((error as $TSFIXME).statusCode === 401) {
          /* If the server returns a 401 error, it's possible that the access token expired during the latency period as this
          request was being sent. In this scenario, snoowrap thought that the access token was valid for a few more seconds, so it
          didn't refresh the token, but the token had expired by the time the request reached the server. To handle this issue,
          invalidate the access token and call oauth_request again, automatically causing the token to be refreshed. */
          // @ts-expect-error
          if (this.accessToken && this.tokenExpiration - Date.now() < MAX_TOKEN_LATENCY) {
            this.accessToken = null;
            this.tokenExpiration = null;
            return oauthRequest.bind(this)(options, attempts);
          }
      }

      throw error;
    });
}

export function _awaitExponentialBackoff (attempts: number) {
  if (attempts === 1) {
    return Promise.resolve();
  }

  return delay((Math.pow(2, attempts - 1) + (Math.random() - 0.3)) * 1000);
}

export function _awaitRatelimit (this: snoowrap) {
  // @ts-expect-error
  if (this.ratelimitRemaining < 1 && Date.now() < this.ratelimitExpiration) {
    // If the ratelimit has been exceeded, delay or abort the request depending on the user's config.
    // @ts-expect-error
    const timeUntilExpiry = this.ratelimitExpiration - Date.now();
    if (this._config.continueAfterRatelimitError) {
      /* If the `continue_after_ratelimit_error` setting is enabled, queue the request, wait until the next ratelimit
      period, and then send it. */
      this._warn(rateLimitWarning(timeUntilExpiry));
      return delay(timeUntilExpiry);
    }
    // Otherwise, throw an error.
    // @ts-expect-error
    throw new RateLimitError(timeUntilExpiry);
  }
  // If the ratelimit hasn't been exceeded, no delay is necessary.
  return Promise.resolve();
}

export function _awaitRequestDelay (this: snoowrap) {
  const now = Date.now();
  const waitTime = this._nextRequestTimestamp - now;
  this._nextRequestTimestamp = Math.max(now, this._nextRequestTimestamp) + this._config.requestDelay;
  return delay(waitTime);
}

/**
* @summary Sends a request to the reddit server, authenticated with the user's client ID and client secret.
* @desc **Note**: This is used internally as part of the authentication process, but it cannot be used to actually fetch content from reddit. To do that, use {@link snoowrap#oauthRequest} or another of snoowrap's helper functions.
*
* This function can work with alternate `this`-bindings, provided that the binding has the `clientId`, `clientSecret`, and `userAgent` properties. This allows it be used if no snoowrap requester has been created yet.
* @param {object|string} options Options for the request; these are passed directly to the [Request API](https://www.npmjs.com/package/request).
* @returns The response from the Reddit server.
* @example
*
* // example: this function could be used to exchange a one-time authentication code for a refresh token.
snoowrap.prototype.credentialedClientRequest.call({
  clientId: 'client id goes here',
  clientSecret: 'client secret goes here',
  userAgent: 'user agent goes here'
}, {
  method: 'post',
  baseUrl: 'https://www.reddit.com',
  uri: 'api/v1/access_token',
  form: {grant_type: 'authorization_code', code: 'code goes here', redirect_uri: 'redirect uri goes here'}
}).then(response => {
  //handle response here
})
*/
export async function credentialedClientRequest (this: snoowrap, options: Parameters<snoowrap['rawRequest']>[0]) {
  return this.rawRequest.call(this, merge({
    json: true,
    auth: {user: this.clientId, pass: this.clientSecret},
    headers: {'user-agent': this.userAgent},
    baseUrl: this._config ? `https://www.${this._config.endpointDomain}` : undefined
  }, options));
}

/**
* @summary Sends a request to the reddit server without authentication.
* @param options Options for the request; These are passed directly to the [Request API](https://www.npmjs.com/package/request).
* @returns The response from the Reddit server.
*/
export async function unauthenticatedRequest(this: snoowrap, options: Parameters<snoowrap['rawRequest']>[0]) {
  return this.rawRequest(merge({
    json: true,
    headers: {'user-agent': this.userAgent},
    baseUrl: `https://www.${this._config.endpointDomain}`
  }, options));
}

/**
* @summary Updates this requester's access token if the current one is absent or expired.
* @desc **Note**: This function is automatically called internally when making a request. While the function is exposed as
a stable feature, using it is rarely necessary unless an access token is needed for some external purpose.
* @returns A Promise that fulfills with the access token when this request is complete.
* @example r.updateAccessToken()
*/
export async function updateAccessToken (this: snoowrap) {
  // If the current access token is missing or expired, and it is possible to get a new one, do so.
  // @ts-expect-error
  if ((!this.accessToken || Date.now() > this.tokenExpiration) && (this.refreshToken || (this.username && this.password))) {
    return credentialedClientRequest.bind(this)({
      method: 'post',
      uri: 'api/v1/access_token',
      form: this.refreshToken
        ? {grant_type: 'refresh_token', refresh_token: this.refreshToken}
        : {grant_type: 'password', username: this.username, password: this.password}
    }).then(tokenInfo => {
      this.accessToken = tokenInfo.access_token;
      this.tokenExpiration = Date.now() + (tokenInfo.expires_in * 1000);
      if (tokenInfo.error === 'invalid_grant') {
        throw new Error('"Invalid grant" error returned from reddit. (You might have incorrect credentials.)');
      } else if (tokenInfo.error_description !== undefined) {
        throw new Error(`Reddit returned an error: ${tokenInfo.error}: ${tokenInfo.error_description}`);
      } else if (tokenInfo.error !== undefined) {
        throw new Error(`Reddit returned an error: ${tokenInfo.error}`);
      }
      this.scope = tokenInfo.scope.split(' ');
      return this.accessToken;
    });
  }

  // Otherwise, just return the existing token.
  return this.accessToken;
}

