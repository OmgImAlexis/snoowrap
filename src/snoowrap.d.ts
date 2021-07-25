// Thanks to these people for type definitions:
//  Vito Samson <https://github.com/vitosamson>
//  TheAppleFreak <https://github.com/TheAppleFreak>
//  Willy Liu <https://github.com/willwull>

// import { Options as RequestOptions } from 'request';
import { $FIXME } from './fix-me';

type RequestOptions = $FIXME;

import {
  Comment,
  Listing,
  ListingOptions,
  SortedListingOptions,
  LiveThread,
  LiveThreadSettings,
  ModmailConversation,
  MultiReddit,
  MultiRedditProperties,
  PrivateMessage,
  RedditContent,
  RedditUser,
  Submission,
  Subreddit,
  SubredditSettings,
} from './objects';

export class Snoowrap {
  static getAuthUrl(options: AuthUrlOptions): string;
  static fromAuthCode(options: AuthCodeOptions): Promise<Snoowrap>;
  static fromApplicationOnlyAuth(options: AuthOnlyOptions): Promise<Snoowrap>;

  _newObject (objectType: string, content: object[]|object, _hasFetched?: boolean): Array<unknown>|object;
  static noConflict(): typeof Snoowrap;

  accessToken: string;
  clientId: string;
  clientSecret: string;
  password: string;
  ratelimitExpiration: number;
  ratelimitRemaining: number;
  refreshToken: string;
  scope: string[];
  tokenExpiration: number;
  userAgent: string;
  username: string;

  constructor(options: SnoowrapOptions);
  checkCaptchaRequirement(): Promise<boolean>;
  checkUsernameAvailability(name: string): Promise<boolean>;
  composeMessage(options: ComposeMessageParams): Promise<$FIXME>;
  config(options?: ConfigOptions): ConfigOptions;
  createLivethread(options: LiveThreadSettings): Promise<LiveThread>;
  createMultireddit(options: MultiRedditProperties & { name: string; subreddits: Subreddit[] | string[]}): Promise<MultiReddit>;
  createSubreddit(options: SubredditSettings): Promise<Subreddit>;
  credentialedClientRequest(options?: RequestOptions): Promise<$FIXME>;
  getBlockedUsers(): Promise<RedditUser[]>;
  getCaptchaImage(identifier: string): Promise<string>;
  getComment(commentId: string): Comment;
  getContributorSubreddits(options?: ListingOptions): Promise<Listing<Subreddit>>;
  getControversial(subredditName?: string, options?: SortedListingOptions): Promise<Listing<Submission>>;
  getDefaultSubreddits(options?: ListingOptions): Promise<Listing<Subreddit>>;
  getFriends(): Promise<RedditUser[]>;
  getGoldSubreddits(options?: ListingOptions): Promise<Listing<Subreddit>>;
  getHot(subredditName?: string, options?: ListingOptions): Promise<Listing<Submission>>;
  getBest(options?: ListingOptions): Promise<Listing<Submission>>;
  getInbox(options?: { filter?: string }): Promise<Listing<PrivateMessage | Comment>>;
  getKarma(): Promise<Array<{ sr: Subreddit; comment_karma: number; link_karma: number; }>>;
  getLivethread(threadId: string): LiveThread;
  getMe(): RedditUser;
  getMessage(messageId: string): PrivateMessage;
  getModeratedSubreddits(options?: ListingOptions): Promise<Listing<Subreddit>>;
  getModmail(options?: ListingOptions): Promise<Listing<PrivateMessage>>;
  getMyMultireddits(): Promise<MultiReddit[]>;
  getMyTrophies(): Promise<Trophy[]>;
  getNew(subredditName?: string, options?: ListingOptions): Promise<Listing<Submission>>;
  getNewCaptchaIdentifier(): Promise<string>;
  getNewComments(subredditName?: string, options?: ListingOptions): Promise<Listing<Comment>>;
  getContentByIds(ids: Array<Submission | Comment | string>) : Promise<Listing<Submission | Comment>>;
  getNewModmailConversations(options?: ListingOptions & { entity?: string }): Promise<Listing<ModmailConversation>>;
  createModmailDiscussion(options: { body: string, subject: string, srName: string }): Promise<ModmailConversation>;
  getNewModmailConversation(id: string): Promise<ModmailConversation>;
  markNewModmailConversationsAsRead(convs: ModmailConversation[]): Promise<void>;
  markNewModmailConversationsAsUnread(convs: ModmailConversation[]): Promise<void>;
  getNewModmailSubreddits(): Promise<Subreddit[]>;
  getUnreadNewModmailConversationsCount(): Promise<{ highlighted: number, notifications: number, archived: number, appeals: number, new: number, inprogress: number, mod: number }>;
  bulkReadNewModmail(subs: Array<Subreddit | string>, state: 'new'|'inprogress'|'mod'|'notifications'|'archived'|'appeals'|'highlighted'|'all'): Promise<Listing<ModmailConversation>>;
  getNewSubreddits(options?: ListingOptions): Promise<Listing<Subreddit>>;
  getOauthScopeList(): Promise<{ [key: string]: { description: string; id: string; name: string } }>;
  getPopularSubreddits(options?: ListingOptions): Promise<Listing<Subreddit>>;
  getPreferences(): Promise<$FIXME>;
  getRandomSubmission(subredditName?: string): Promise<Submission>;
  getRising(subredditName?: string, options?: ListingOptions): Promise<Listing<Submission>>;
  getSavedCategories(): Promise<$FIXME[]>;
  getSentMessages(options?: ListingOptions): Promise<Listing<PrivateMessage>>;
  getStickiedLivethread(): Promise<LiveThread | undefined>;
  getSubmission(submissionId: string): Submission;
  getSubreddit(displayName: string): Subreddit;
  getSubscriptions(options?: ListingOptions): Listing<Subreddit>;
  getTop(subredditName?: string, options?: SortedListingOptions): Promise<Listing<Submission>>;
  getUnreadMessages(options?: ListingOptions): Promise<Listing<PrivateMessage>>;
  getUser(name: string): RedditUser;
  markAsVisited(links: Submission[]): Promise<void>;
  markMessagesAsRead(messages: PrivateMessage[] | string[]): Promise<void>;
  markMessagesAsUnread(messages: PrivateMessage[] | string[]): Promise<void>;
  oauthRequest(options: RequestOptions): Promise<$FIXME>;
  rawRequest(options: RequestOptions): Promise<$FIXME>;
  readAllMessages(): Promise<void>;
  revokeRefreshToken(): Promise<void>;
  search(options: SearchOptions): Promise<Listing<Submission>>;
  searchSubredditNames(options: { query: string; exact?: boolean; includeNsfw?: boolean; }): Promise<string[]>;
  searchSubreddits(options: ListingOptions & { query: string }): Promise<Listing<Subreddit>>;
  searchSubredditTopics(options: { query: string; }): Promise<Subreddit[]>;
  submitLink(options: SubmitLinkOptions): Promise<Submission>;
  submitSelfpost(options: SubmitSelfPostOptions): Promise<Submission>;
  unauthenticatedRequest(options: RequestOptions): Promise<$FIXME>; // options: https://www.npmjs.com/package/request
  updateAccessToken(): Promise<string>;
  updatePreferences(updatedPreferences: $FIXME): Promise<void>;
}

export interface SnoowrapOptions {
  userAgent: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  refreshToken?: string;
  accessToken?: string;
}

export interface ConfigOptions {
  endpointDomain?: string;
  requestDelay?: number;
  requestTimeout?: number;
  continueAfterRatelimitError?: boolean;
  retryErrorCodes?: number[];
  maxRetryAttempts?: number;
  warnings?: boolean;
  debug?: boolean;
  logger?: Pick<typeof console, 'warn' | 'info' | 'debug' | 'trace'>;
  proxies?: boolean;
}

export interface BaseAuthOptions {
  clientId: string;
  endpointDomain?: string;
}

export interface AuthUrlOptions extends BaseAuthOptions {
  scope: string[];
  redirectUri: string;
  /** Defaults to `true` */
  permanent?: boolean;
  state?: string;
}

export interface AuthCodeOptions extends BaseAuthOptions {
  code: string;
  userAgent: string;
  clientSecret?: string;
  redirectUri: string;
  /** Defaults to `true` */
  permanent?: boolean;
  endpointDomain?: string;
  deviceId?: string;
}

export type GrantType = 'client_credentials' | 'https://oauth.reddit.com/grants/installed_client'

interface BaseAuthOnlyOptions extends BaseAuthOptions{
  userAgent: string
}

interface AuthOnlyCredentialsOptions extends BaseAuthOnlyOptions {
  clientSecret: string
  grantType: 'client_credentials',
  deviceId?: string
}

interface AuthOnlyInstalledOptions extends BaseAuthOnlyOptions {
  clientSecret?: string
  grantType?: 'https://oauth.reddit.com/grants/installed_client'
  deviceId: string
}

export type AuthOnlyOptions = AuthOnlyCredentialsOptions | AuthOnlyInstalledOptions

export type Sort = 'confidence' | 'top' | 'new' | 'controversial' | 'old' | 'random' | 'qa';

export interface ModAction extends RedditContent<ModAction> {
  target_body: string;
  mod_id36: string;
  created_utc: number;
  subreddit: Subreddit;
  target_title: string | null;
  target_permalink: string;
  subreddit_name_prefixed: string;
  details: string | null;
  action: string;
  target_author: string;
  target_fullname: string;
  sr_id36: string;
  id: string;
  mod: string;
  description: string | null;
}

export interface SubmitSelfPostOptions {
  text?: string;
  subredditName: string;
  title: string;
  sendReplies?: boolean;
  captchaIden?: string;
  captchaResponse?: string;
  nsfw?: boolean;
  spoiler?: boolean;
  flairId?: string;
  flairText?: string;
}

export interface SubmitLinkOptions {
  subredditName: string;
  title: string;
  url: string;
  sendReplies?: boolean;
  resubmit?: boolean;
  captchaIden?: string;
  captchaResponse?: string;
  nsfw?: boolean;
  spoiler?: boolean;
  flairId?: string;
  flairText?: string;
}

export interface ComposeMessageParams {
  to: RedditUser | Subreddit | string;
  subject: string;
  text: string;
  fromSubreddit?: Subreddit | string;
  captchaIden?: string;
  captchaResponse?: string;
}

export interface BaseSearchOptions {
  query: string;
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
  syntax?: 'cloudsearch' | 'lucene' | 'plain';
}

export interface SearchOptions extends BaseSearchOptions {
  subreddit?: Subreddit | string;
  restrictSr?: boolean;
  after?: string;
  before?: string;
  category?: string;
  count?: number;
  include_facets?: boolean;
  limit?: number
  show?: 'all',
  sr_detail?: string
  type?: string
}

export interface Trophy {
  icon_70: string;
  icon_40: string;
  name: string;
  url: string;
  award_id: string;
  id: string;
  description: string;
}

export {
  Comment,
  Listing,
  LiveThread,
  MultiReddit,
  PrivateMessage,
  RedditContent,
  RedditUser,
  ReplyableContent,
  Submission,
  Subreddit,
  VoteableContent,
  WikiPage
} from './objects';
