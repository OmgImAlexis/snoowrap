import { config } from 'dotenv';

// Load .env file
config();

export const userAgent = process.env.USER_AGENT ?? 'THIS_IS_A_FAKE_USER_AGENT_USED_FOR_TESTS';
export const accessToken = process.env.ACCESS_TOKEN ?? 'THIS_IS_A_FAKE_ACCESS_TOKEN_USED_FOR_TESTS';
export const refreshToken = process.env.REFRESH_TOKEN ?? 'THIS_IS_A_FAKE_REFRESH_TOKEN_USED_FOR_TESTS';
export const clientId = process.env.CLIENT_ID ?? 'THIS_IS_A_FAKE_CLIENT_ID_USED_FOR_TESTS';
export const clientSecret = process.env.CLIENT_SECRET ?? 'THIS_IS_A_FAKE_CLIENT_SECRET_USED_FOR_TESTS';
export const username = process.env.USERNAME ?? 'THIS_IS_A_FAKE_USERNAME_USED_FOR_TESTS';
export const password = process.env.PASSWORD ?? 'THIS_IS_A_FAKE_PASSWORD_USED_FOR_TESTS';

export const credentials = {
    userAgent,
    clientId,
    clientSecret,
    username,
    password
};
