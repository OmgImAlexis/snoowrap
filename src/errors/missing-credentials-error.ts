import dedent from 'dedent';

export class MissingCredentialsError extends Error {
    constructor() {
        super(dedent`
            Missing credentials passed to SnooWrapped constructor.
            You must pass an object containing one of the following:
                (a) userAgent, clientId, clientSecret, and refreshToken properties
                (b) userAgent and accessToken properties
                (c) userAgent, clientId, clientSecret, username, and password properties
        `);
    }
}
