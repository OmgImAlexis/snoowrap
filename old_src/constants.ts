export const MODULE_NAME = 'snoowrap';
export const VERSION = '1.23.0';
export const DOCS_LINK = 'https://not-an-aardvark.github.io/snoowrap/';
export const API_RULES_LINK = 'https://github.com/reddit/reddit/wiki/API';
/* USER_KEYS and SUBREDDIT_KEYS are keys that are replaced by RedditUser and Subreddit objects when encountered in
`snoowrap#_populate`. `author`, `approved_by`, `banned_by`, and `subreddit` all appear in fetched Submissions, among other
places. `user` appears in responses from the api/flairlist endpoint, and `sr` appears in responses from the `api/v1/me/karma`
endpoint. */
export const USER_KEYS = new Set(['author', 'approved_by', 'banned_by', 'user']);
export const SUBREDDIT_KEYS = new Set(['subreddit', 'sr']);
export const KINDS = {
  t1: 'Comment',
  t2: 'RedditUser',
  t3: 'Submission',
  t4: 'PrivateMessage',
  t5: 'Subreddit',
  t6: 'Trophy',
  t8: 'PromoCampaign',
  Listing: 'Listing',
  more: 'More',
  UserList: 'UserList',
  KarmaList: 'KarmaList',
  TrophyList: 'TrophyList',
  subreddit_settings: 'SubredditSettings',
  modaction: 'ModAction',
  wikipage: 'WikiPage',
  wikipagesettings: 'WikiPageSettings',
  wikipagelisting: 'WikiPageListing',
  LiveUpdateEvent: 'LiveThread',
  LiveUpdate: 'LiveUpdate',
  LabeledMulti: 'MultiReddit',
  ModmailConversation: 'ModmailConversation',
  ModmailConversationAuthor: 'ModmailConversationAuthor'
};
export const USERNAME_REGEX = /^[\w-]{1,20}$/;
export const MODERATOR_PERMISSIONS = ['wiki' as const, 'posts' as const, 'access' as const, 'mail' as const, 'config' as const, 'flair' as const];
export const LIVETHREAD_PERMISSIONS = ['update' as const, 'edit' as const, 'manage' as const];
export const HTTP_VERBS = ['delete' as const, 'get' as const, 'head' as const, 'patch' as const, 'post' as const, 'put' as const]
export const IDEMPOTENT_HTTP_VERBS = ['delete' as const, 'get' as const, 'head' as const, 'put' as const];
export const MAX_TOKEN_LATENCY = 10000 as const;
export const MAX_API_INFO_AMOUNT = 100 as const;
export const MAX_API_MORECHILDREN_AMOUNT = 20 as const;
export const MAX_LISTING_ITEMS = 100 as const;
