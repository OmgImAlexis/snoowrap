import ava, { TestInterface } from 'ava';
import { RequiredArgumentError } from '../src/errors/required-argument-erorr';
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
        new Submission({ name: '2np694' }, snooWrapped);
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
        await snooWrapped.getSubmission('2np694').fetch();
    });

    // Returns an unfetched "Submission"
    const submission = snooWrapped.getSubmission('2np694');
    t.not(submission, undefined);
    t.true(submission instanceof Submission);
    t.is(submission.name, 't3_2np694');
    t.is(submission.title, undefined);
    t.is(submission.author, undefined);
    t.is(submission.votes.up, undefined);
    t.is(submission.votes.down, undefined);
    t.is(submission.created, undefined);
    t.is(submission.edited, undefined);
    t.is(submission.gilded, undefined);
    t.is(submission.subredditType, undefined);
    t.is(submission.domain, undefined);
    t.is(submission.body, undefined);
    t.is(submission.archived, undefined);
    t.is(submission.nsfw, undefined);
    t.is(submission.comments, undefined);

    // Returns a fetched "Submission"
    const fetchedSubmission = await submission.fetch();
    t.not(fetchedSubmission, undefined);
    t.true(fetchedSubmission instanceof Submission);
    t.is(fetchedSubmission.name, 't3_2np694');
    t.is(fetchedSubmission.title, 'What tasty food would be distusting if eaten over rice?');
    t.is(fetchedSubmission.author?.name, 'DO_U_EVN_SPAGHETTI');
    t.true((fetchedSubmission.votes.up || 0) >= 57000);
    t.is(fetchedSubmission.votes.down, 0);
    t.is(fetchedSubmission.created?.getTime(), new Date(1417208878).getTime());
    t.is(fetchedSubmission.edited?.getTime(), new Date(1417251723).getTime());
    t.is(fetchedSubmission.gilded, 14);
    t.is(fetchedSubmission.subredditType, 'public');
    t.is(fetchedSubmission.domain, 'self.AskReddit');
    t.is(fetchedSubmission.body, '');
    t.true(fetchedSubmission.archived);
    t.false(fetchedSubmission.nsfw);
    t.is(fetchedSubmission.comments?.length, 93);
});

test.serial('markNsfw()', async t => {
    const { snooWrapped } = t.context;

    // Get submission
    const submission = snooWrapped.getSubmission('ovklvg');
    t.is(submission.nsfw, undefined);

    // Mark NSFW
    const updatedSubmission = await submission.markNsfw();

    // Now Submission is marked as NSFW
    t.true(updatedSubmission.nsfw);

    // Double check it was actually updated on Reddit
    const fetchedSubmission = await updatedSubmission.fetch();
    t.true(fetchedSubmission.nsfw);
});

test.serial('unmarkNsfw()', async t => {
    const { snooWrapped } = t.context;

    // Get submission
    const submission = snooWrapped.getSubmission('ovklvg');
    t.is(submission.nsfw, undefined);

    // Unmark NSFW
    const updatedSubmission = await submission.unmarkNsfw();

    // Now Submission is marked as SFW
    t.false(updatedSubmission.nsfw);

    // Double check it was actually updated on Reddit
    const fetchedSubmission = await updatedSubmission.fetch();
    t.false(fetchedSubmission.nsfw);
});