# Snoowrapped 

A fully-featured wrapper for the Reddit API.

---

## Note
This is based on what I've learnt from reading the source of SnooWrap.  
SnooWrap works fine it's just a tad outdated and doesn't have the best Typescript integration.

---

### Features

* Snoowrapped provides a simple interface to access every reddit API endpoint. For example, the method to get a user profile is just `getUser()`, and the method to upvote something is just `upvote()`.
* Snoowrapped is non-blocking; all of its API calls are asynchronous and return Promises. This means that you can handle concurrent requests however you want to, and you can use Snoowrapped as part of a larger process without it holding everything back.
* Each Snoowrapped object is completely independent. This means that you can have scripts from separate accounts making requests at the same time.
* After you provide a token once, Snoowrapped will refresh it on its own from then on -- you won't have to worry about authentication again.
* Snoowrapped uses lazy objects, so it never fetches more than it needs to.
* Snoowrapped has built-in ratelimit protection. If you hit Reddit's ratelimit, you can choose to queue the request, and then run it after the current ratelimit period runs out. That way you won't lose a request if you go a bit too fast.
* Snoowrapped will retry its request a few times if reddit returns an error due to its servers being overloaded.

These features ensure that you can write less boilerplate code and focus more on actually doing what you want to do.

---

### Examples

NOTE: The following examples illustrate how to use SnooWrapped. However, hardcoding credentials directly into your source code is generally a bad idea in practice (especially if you're also making your source code public). Instead, it's better to either (a) use a separate config file that isn't committed into version control, or (b) use environment variables.

Create a new SnooWrapped instance with OAuth credentials.
For more information on getting credentials, see here: https://github.com/not-an-aardvark/reddit-oauth-helper
```ts
const snooWrapped = new SnooWrapped({
  userAgent: 'put your user-agent string here',
  clientId: 'put your client id here',
  clientSecret: 'put your client secret here',
  refreshToken: 'put your refresh token here'
});
```

Alternatively, just pass in a username and password for script-type apps.
```ts
const otherSnooWrapped = new SnooWrapped({
  userAgent: 'put your user-agent string here',
  clientId: 'put your client id here',
  clientSecret: 'put your client secret here',
  username: 'put your username here',
  password: 'put your password here'
});
```

That's the entire setup process, now you can just make requests.


Submitting a link to a subreddit
```ts
await sW.getSubreddit('gifs').submitLink({
  title: 'Mt. Cameramanjaro',
  url: 'https://i.imgur.com/n5iOc72.gifv'
});
```

Printing a list of the titles on the front page
```ts
sW.getHot().map(post => post.title).then(console.log);
```

Extracting every comment on a thread
```ts
sW.getSubmission('4j8p6d').expandReplies({ limit: Infinity, depth: Infinity }).then(console.log);
```

Automating moderation tasks
```ts
const queueItems = await sW.getSubreddit('some_subreddit_name').getModqueue({ limit: 100 }).fetch();
queueItems.filter(someRemovalCondition).forEach(flaggedItem => {
  await flaggedItem.remove();
  await flaggedItem.subreddit.banUser(flaggedItem.author);
});
```

Automatically creating a stickied thread for a moderated subreddit
```ts
const submission = sW.getSubreddit('some_subreddit_name').submitSelfpost({title: 'Daily thread', text: 'Discuss things here'});
await submission.sticky();
await submission.distinguish();
await submission.approve();
await submission.assignFlair({text: 'Daily Thread flair text', css_class: 'daily-thread'});
await submission.reply('This is a comment that appears on that daily thread');
// etc. etc.

// Printing the content of a wiki page
sW.getSubreddit('AskReddit').getWikiPage('bestof').fetch().content_md.then(console.log);
```

---

### Live threads

Reddit's [live threads](https://www.reddit.com/r/live/wiki/index) are different from most other content, in that messages are distributed through websockets instead of a RESTful API. SnooWrapped supports this protocol under the hood by representing the content stream as an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). For example, the following script will stream all livethread updates to the console as they appear:

```js
sW.getLivethread('whrdxo8dg9n0').stream.on('update', console.log);
```

---

### To include in a project

**Node:**

```bash
npm install snoowrapped --save
```
```ts
import { SnooWrapped } from 'snoowrapped';
```
OR
```js
const { SnooWrapped } = require('snoowrapped');
```

---

### Development
`npm run test`  

`npm run test:coverage`  

`npm run type:coverage`

---

### License

This software is freely distributable under the [MIT License](https://github.com/not-an-aardvark/snoowrap/blob/master/LICENSE.md).
