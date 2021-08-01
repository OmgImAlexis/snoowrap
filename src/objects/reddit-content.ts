import util from 'util';
import fetch, { Headers } from 'node-fetch';
import mergeDeep from 'merge-deep';
import { RequiredArgumentError } from '../errors/required-argument-erorr';
import { SnooWrapper } from '../snoo-wrapper';
import { URL, URLSearchParams } from 'url';

export class RedditContent {
    public readonly name: string;
    protected snooWrapper: SnooWrapper;
    protected data: any;

    constructor(data: { name: string; }, snooWrapper: SnooWrapper) {
        if (!data.name) throw new RequiredArgumentError('data.name');
        if (!snooWrapper) throw new RequiredArgumentError('snooWrapper');

        // Save data
        this.data = data;
        this.name = data.name;

        // Save SnooWrapper instance
        this.snooWrapper = snooWrapper;
    }

    [util.inspect.custom]() {
        // In debug mode return whole object
        if (process.env.DEBUG) return this;

        // Strip off protected fields
        const that = this as any;
        delete that.data;
        delete that.snooWrapper;
        return that;
    }

    protected get uri() {
        return '';
    }

    protected _populate(data: any) {
        if (data.error === 404) return;
        return data;
    }

    async fetch<T = this>() {
        return this._fetchAndPopulate(this.uri) as Promise<T>;
    }

    private async _updateAccessToken () {
        // If the current access token is missing or expired, and it is possible to get a new one, do so.
        if (
            (!this.snooWrapper.credentials.accessToken || Date.now() > (this.snooWrapper.credentials.tokenExpiration?.getTime() || 0)) &&
            (this.snooWrapper.credentials.refreshToken || (this.snooWrapper.credentials.username && this.snooWrapper.credentials.password))
        ) {            
            // Build headers
            const headers = new Headers();
            headers.append("Authorization", `Basic ${Buffer.from(`${this.snooWrapper.credentials.clientId}:${this.snooWrapper.credentials.clientSecret}`).toString('base64')}`);
            headers.append("User-Agent", "pheonix_starship API/0.0.1 by u/pheonix_starship");
            headers.append("Content-Type", "application/x-www-form-urlencoded");

            // Build body
            const body = new URLSearchParams();
            body.append('scope', '*');
            if (this.snooWrapper.credentials.refreshToken) {
                body.append('grant_type', 'refresh_token');
                body.append('refresh_token', this.snooWrapper.credentials.refreshToken);
            } else {
                body.append('grant_type', 'password');
                body.append('username', this.snooWrapper.credentials.username as string);
                body.append('password', this.snooWrapper.credentials.password as string);
            }

            // Send request
            const response = await fetch('https://www.reddit.com/api/v1/access_token', { method: 'POST', headers, body }).then(response => response.json());

            // Check for errors
            if (response.error) {
                if (response.error === 'invalid_grant') {
                  throw new Error('"Invalid grant" error returned from reddit. (You might have incorrect credentials.)');
                } else if (response.error_description !== undefined) {
                  throw new Error(`Reddit returned an error: ${response.error}: ${response.error_description}`);
                } else if (response.error !== undefined) {
                  throw new Error(`Reddit returned an error: ${response.error}`);
                }
            }

            // Save access token
            this.snooWrapper.credentials.accessToken = response.access_token;
            this.snooWrapper.credentials.tokenExpiration = new Date(Date.now() + (response.expires_in * 1000));
            this.snooWrapper.credentials.scope = response.scope;

            // Return the newly saved token
            return response.access_token as string;
        }

        // Otherwise, just return the existing token.
        return this.snooWrapper.credentials.accessToken;
    }

    protected async _fetch(uri: string, { query, ...options }: Parameters<typeof fetch>[1] & { query?: Record<string, any>; } = {}, attempts = 1) {
        // Update access token
        const accessToken = await this._updateAccessToken();

        // Resolve URL
        const url = new URL(uri, 'https://oauth.reddit.com/');
        Object.entries(query ?? {}).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        // Resolve options
        const opts = mergeDeep({
            headers: {
                'User-Agent': this.snooWrapper.userAgent,
                'Authorization': `Bearer ${accessToken}`
            }
        }, options);

        // Send query to Reddit
        return fetch(url.href, opts)
            .then(response => response.json())
            .then(response => {
                if ('error' in response && response.error === 404) throw new Error('404 Not Found');
                if ('error' in response && response.error === 403) throw new Error('403 Forbidden');
                return response;
            });
    }

    protected async _fetchAndPopulate(uri: string, { query, ...options }: Parameters<typeof fetch>[1] & { query?: Record<string, any>; } = {}, attempts = 1) {
        return this._fetch(uri, options).then(response => this._populate(response));
    }
}