import util from 'util';
import fetch, { Headers } from 'node-fetch';
import mergeDeep from 'merge-deep';
import { RequiredArgumentError } from '../errors/required-argument-erorr';
import { SnooWrapped } from '../snoo-wrapped';
import { URL, URLSearchParams } from 'url';

export class RedditContent<Data extends { name: string; }> {
    public readonly name: string;
    protected snooWrapped: SnooWrapped;
    protected data: Data;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        if (!data.name) throw new RequiredArgumentError('data.name');
        if (!snooWrapped) throw new RequiredArgumentError('snooWrapped');

        // Save data
        this.data = data;
        this.name = data.name;

        // Save SnooWrapped instance
        this.snooWrapped = snooWrapped;
    }

    [util.inspect.custom]() {
        // In debug mode return whole object
        if (process.env.DEBUG) return this;

        // Strip off protected fields
        const that = this as any;
        delete that.data;
        delete that.snooWrapped;
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
            (!this.snooWrapped.credentials.accessToken || Date.now() > (this.snooWrapped.credentials.tokenExpiration?.getTime() || 0)) &&
            (this.snooWrapped.credentials.refreshToken || (this.snooWrapped.credentials.username && this.snooWrapped.credentials.password))
        ) {            
            // Build headers
            const headers = new Headers();
            headers.append("Authorization", `Basic ${Buffer.from(`${this.snooWrapped.credentials.clientId}:${this.snooWrapped.credentials.clientSecret}`).toString('base64')}`);
            headers.append("User-Agent", "pheonix_starship API/0.0.1 by u/pheonix_starship");
            headers.append("Content-Type", "application/x-www-form-urlencoded");

            // Build body
            const body = new URLSearchParams();
            body.append('scope', '*');
            if (this.snooWrapped.credentials.refreshToken) {
                body.append('grant_type', 'refresh_token');
                body.append('refresh_token', this.snooWrapped.credentials.refreshToken);
            } else {
                body.append('grant_type', 'password');
                body.append('username', this.snooWrapped.credentials.username as string);
                body.append('password', this.snooWrapped.credentials.password as string);
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
            this.snooWrapped.credentials.accessToken = response.access_token;
            this.snooWrapped.credentials.tokenExpiration = new Date(Date.now() + (response.expires_in * 1000));
            this.snooWrapped.credentials.scope = response.scope;

            // Return the newly saved token
            return response.access_token as string;
        }

        // Otherwise, just return the existing token.
        return this.snooWrapped.credentials.accessToken;
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
                'User-Agent': this.snooWrapped.userAgent,
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