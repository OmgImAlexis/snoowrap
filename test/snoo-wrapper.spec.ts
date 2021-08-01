import ava, { TestInterface } from 'ava';
import { MissingCredentialsError } from '../src/errors/missing-credentials-error';
import { RequiredArgumentError } from '../src/errors/required-argument-erorr';
import { SnooWrapped } from '../src/snoo-wrapped';
import { credentials, userAgent, accessToken, clientId, clientSecret, refreshToken, username, password } from './_helpers/credentials';

const test = ava as TestInterface<{
    userAgent: string;
    accessToken: string;
    clientId: string;
    clientSecret: string;    
    refreshToken: string;
    username: string;
    password: string;
    snooWrapped: SnooWrapped;
}>;

test.before(t => {
    t.context = {
        userAgent,
        accessToken,
        clientId,
        clientSecret,
        refreshToken,
        username,
        password,
        snooWrapped: new SnooWrapped(credentials)
    };
})

test.serial('credentials', t => {
    const { userAgent, accessToken, clientId, clientSecret, refreshToken, username, password } = t.context;

    // OK
    t.notThrows(() => {
        new SnooWrapped({ userAgent, clientId, clientSecret, accessToken });
        new SnooWrapped({ userAgent, clientId, clientSecret, refreshToken });
        new SnooWrapped({ userAgent, clientId, clientSecret, username, password });
    });

    // Missing "options.userAgent"
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapped();
    }, { instanceOf: RequiredArgumentError });

    // Missing "options.userAgent"
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapped({});
    }, { instanceOf: RequiredArgumentError });

    // Missing credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapped({ userAgent });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapped({ userAgent, clientId });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapped({ userAgent, clientId, username });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapped({ userAgent, username });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapped({ userAgent, refreshToken, password });
    }, { instanceOf: MissingCredentialsError });
});

test.serial('getComment()', t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(() => {
        snooWrapped.getComment('THIS_IS_A_FAKE_COMMENT_ID_USED_FOR_TESTS');
    });
});

test.serial('getUser()', t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(() => {
        snooWrapped.getUser('THIS_IS_A_FAKE_USER_ID_USED_FOR_TESTS');
    });
});

test.serial('getSubmission()', t => {
    const { snooWrapped } = t.context;

    // OK
    t.notThrows(() => {
        snooWrapped.getSubmission('THIS_IS_A_FAKE_SUBMISSION_ID_USED_FOR_TESTS');
    });
});
