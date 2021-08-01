import ava, { TestInterface } from 'ava';
import { MissingCredentialsError } from '../src/errors/missing-credentials-error';
import { RequiredArgumentError } from '../src/errors/required-argument-erorr';
import { SnooWrapper } from '../src/snoo-wrapper';
import { credentials, userAgent, accessToken, clientId, clientSecret, refreshToken, username, password } from './_helpers/credentials';

const test = ava as TestInterface<{
    userAgent: string;
    accessToken: string;
    clientId: string;
    clientSecret: string;    
    refreshToken: string;
    username: string;
    password: string;
    snooWrapper: SnooWrapper;
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
        snooWrapper: new SnooWrapper(credentials)
    };
})

test.serial('credentials', t => {
    const { userAgent, accessToken, clientId, clientSecret, refreshToken, username, password } = t.context;

    // OK
    t.notThrows(() => {
        new SnooWrapper({ userAgent, clientId, clientSecret, accessToken });
        new SnooWrapper({ userAgent, clientId, clientSecret, refreshToken });
        new SnooWrapper({ userAgent, clientId, clientSecret, username, password });
    });

    // Missing "options.userAgent"
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapper();
    }, { instanceOf: RequiredArgumentError });

    // Missing "options.userAgent"
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapper({});
    }, { instanceOf: RequiredArgumentError });

    // Missing credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapper({ userAgent });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapper({ userAgent, clientId });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapper({ userAgent, clientId, username });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapper({ userAgent, username });
    }, { instanceOf: MissingCredentialsError });

    // Incorrect credentials
    t.throws(() => {
        // @ts-expect-error
        new SnooWrapper({ userAgent, refreshToken, password });
    }, { instanceOf: MissingCredentialsError });
});

test.serial('getComment()', t => {
    const { snooWrapper } = t.context;

    // OK
    t.notThrows(() => {
        snooWrapper.getComment('THIS_IS_A_FAKE_COMMENT_ID_USED_FOR_TESTS');
    });
});

test.serial('getUser()', t => {
    const { snooWrapper } = t.context;

    // OK
    t.notThrows(() => {
        snooWrapper.getUser('THIS_IS_A_FAKE_USER_ID_USED_FOR_TESTS');
    });
});

test.serial('getSubmission()', t => {
    const { snooWrapper } = t.context;

    // OK
    t.notThrows(() => {
        snooWrapper.getSubmission('THIS_IS_A_FAKE_SUBMISSION_ID_USED_FOR_TESTS');
    });
});
