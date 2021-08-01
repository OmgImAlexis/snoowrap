import ava, { TestInterface } from 'ava';
import { RequiredArgumentError } from '../src/errors/required-argument-erorr';
import { RedditUser } from '../src/objects/reddit-user';
import { Submission } from '../src/objects/submission';
import { SnooWrapped } from '../src/snoo-wrapped';
import { credentials } from './_helpers/credentials';

const test = ava as TestInterface<{
    snooWrapped: SnooWrapped;
}>;

test.before(t => {
    t.context = {
        snooWrapped: new SnooWrapped(credentials)
    };
})

test.serial('constructor', t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(() => {
        new RedditUser({ name: 'OmgImAlexis' }, snooWrapped);
    });

    // Missing "name"
    t.throws(() => {
        // @ts-expect-error
        new Submission({}, snooWrapped);
    }, { instanceOf: RequiredArgumentError });

    // Missing "snooWrapped"
    t.throws(() => {
        // @ts-expect-error
        new Submission({});
    }, { instanceOf: RequiredArgumentError });
});

test.serial('fetch()', async t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(async () => {
        await snooWrapped.getUser('OmgImAlexis').fetch();
    });

    // Returns an unfetched "Submission"
    const redditUser = snooWrapped.getUser('OmgImAlexis');
    t.not(redditUser, undefined);
    t.true(redditUser instanceof RedditUser);
    t.is(redditUser.name, 'OmgImAlexis');
    t.is(redditUser.created, undefined);
    t.is(redditUser.isGold, undefined);
    t.is(redditUser.isMod, undefined);
    t.is(redditUser.isVerified, undefined);
    t.is(redditUser.hasVerifiedEmail, undefined);
    t.is(redditUser.karma?.awardee, undefined);
    t.is(redditUser.karma?.awarder, undefined);
    t.is(redditUser.karma?.comment, undefined);
    t.is(redditUser.karma?.link, undefined);
    t.is(redditUser.karma?.total, undefined);

    // Returns a fetched "fetchedRedditUser"
    const fetchedRedditUser = await redditUser.fetch();
    t.not(fetchedRedditUser, undefined);
    t.true(fetchedRedditUser instanceof RedditUser);
    t.is(fetchedRedditUser.name, 'OmgImAlexis');
    t.is(fetchedRedditUser.id, 'f29oz');
    t.is(fetchedRedditUser.created?.getTime(), new Date(1391176276).getTime());
    t.true(fetchedRedditUser.isGold);
    t.true(fetchedRedditUser.isMod);
    t.true(fetchedRedditUser.isVerified);
    t.true(fetchedRedditUser.hasVerifiedEmail);
    t.true((fetchedRedditUser.karma?.awardee || 0) >= 461);
    t.true((fetchedRedditUser.karma?.awarder || 0) >= 10343);
    t.true((fetchedRedditUser.karma?.comment || 0) >= 9476);
    t.true((fetchedRedditUser.karma?.link || 0) >= 25392);
    t.true((fetchedRedditUser.karma?.total || 0) >= 45672);
});
