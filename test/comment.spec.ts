import ava, { TestInterface } from 'ava';
import { RequiredArgumentError } from '../src/errors/required-argument-erorr';
import { Comment } from '../src/objects/comment';
import { Submission } from '../src/objects/submission';
import { SnooWrapper } from '../src/snoo-wrapper';
import { credentials } from './_helpers/credentials';

const test = ava as TestInterface<{
    snooWrapper: SnooWrapper;
}>;

test.before(t => {
    t.context = {
        snooWrapper: new SnooWrapper(credentials)
    };
})

test.serial('constructor', t => {
    const { snooWrapper } = t.context;

    // OK
    t.notThrows(() => {
        new Comment({ name: 'cmfwyl2' }, snooWrapper);
    });

    // Missing "name"
    t.throws(() => {
        // @ts-expect-error
        new Submission({}, snooWrapper);
    }, { instanceOf: RequiredArgumentError });

    // Missing "snooWrapper"
    t.throws(() => {
        // @ts-expect-error
        new Submission({});
    }, { instanceOf: RequiredArgumentError });
});

test.serial('fetch()', async t => {
    const { snooWrapper } = t.context;

    // OK
    t.notThrows(async () => {
        await snooWrapper.getComment('c0b6xx0').fetch();
    });

    // Returns an unfetched "Comment"
    const comment = snooWrapper.getComment('c0b6xx0');
    t.not(comment, undefined);
    t.true(comment instanceof Comment);
    t.is(comment.name, 't1_c0b6xx0');
    t.is(comment.author, undefined);
    t.is(comment.votes?.up, undefined);
    t.is(comment.votes?.down, undefined);
    t.is(comment.created, undefined);
    t.is(comment.edited, undefined);
    t.is(comment.gilded, undefined);
    t.is(comment.subredditType, undefined);
    t.is(comment.body, undefined);
    t.is(comment.archived, undefined);

    // Returns a fetched "Comment"
    const fetchedComment = await comment.fetch();
    t.not(fetchedComment, undefined);
    t.true(fetchedComment instanceof Comment);
    t.is(fetchedComment.name, 't1_c0b6xx0');
    t.is(fetchedComment.author?.name, 'Kharos');
    t.true((fetchedComment.votes.up || 0) >= 6200);
    t.is((fetchedComment.votes.down || 0), 0);
    t.is(fetchedComment.created?.getTime(), new Date(1247932861).getTime());
    t.is(fetchedComment.edited?.getTime(), 0);
    t.is(fetchedComment.gilded, 3);
    t.is(fetchedComment.subredditType, 'public');
    t.is(fetchedComment.body, 'Don\'t tell me what to do!\nUpvoted.');
    t.true(fetchedComment.archived);
});
