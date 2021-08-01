import test from 'ava';
import { Snoowrap } from '../dist/snoowrap';
import { NoCredentialsError } from '../src/errors';

test('constructor throws an error if no user-agent is provided', t => {
    t.throws(() => {
        // @ts-expect-error
        new snoowrap({});
    }, { instanceOf: TypeError });
});

test('constructor throws an error if insufficient credentials are provided', t => {
    t.throws(() => {
        new Snoowrap({
            userAgent: 'a',
            clientId: 'b',
            clientSecret: 'c'
        });
    }, { instanceOf: NoCredentialsError });
});

test('constructor does not throw an error if only an access token is provided', t => {
    t.notThrows(() => {
        new Snoowrap({userAgent: 'a', accessToken: 'blah'});
    });
});

// it('constructor throws an error if the access token is not a string', () => {
//     expect(() => new snoowrap({
//     userAgent: 'a',
//     // @ts-expect-error
//     accessToken: {}
//     })).to.throw();
//     expect(() => new snoowrap({
//     userAgent: 'a',
//     // @ts-expect-error
//     accessToken: []
//     })).to.throw();
//     expect(() => new snoowrap({
//     userAgent: 'a',
//     // @ts-expect-error
//     accessToken: 123
//     })).to.throw();
// });

// it('constructor does not throw an error if a userAgent, clientId, clientSecret, and refreshToken are provided', () => {
//     expect(() => new snoowrap({userAgent: 'a', clientId: 'b', clientSecret: 'c', refreshToken: 'd'})).not.to.throw();
// });

// it('constructor throws an error if refreshToken is not a string', () => {
//     expect(() => new snoowrap({
//     userAgent: 'a', clientId: 'b', clientSecret: 'c',
//     // @ts-expect-error
//     refreshToken: {}
//     })).to.throw();
//     expect(() => new snoowrap({
//     userAgent: 'a', clientId: 'b', clientSecret: 'c',
//     // @ts-expect-error
//     refreshToken: []
//     })).to.throw();
//     expect(() => new snoowrap({
//     userAgent: 'a', clientId: 'b', clientSecret: 'c',
//     // @ts-expect-error
//     refreshToken: 123
//     })).to.throw();
// });

// it('constructor does not throw an error if a userAgent, clientId, clientSecret, username, and password are provided', () => {
//     expect(() => {
//     return new snoowrap({userAgent: 'a', clientId: 'b', clientSecret: 'c', username: 'd', password: 'e'});
//     }).not.to.throw();
// });

// it('constructor allows the clientSecret to be an empty string', () => {
//     expect(() => new snoowrap({userAgent: 'a', clientId: 'b', clientSecret: '', refreshToken: 'd'})).not.to.throw();
// });