import { SnooWrapped } from "../snoo-wrapped";
import { SubredditType } from "../types";
import { Comment, RawComment } from "./comment";
import { RedditContent } from "./reddit-content";
import { RedditUser } from "./reddit-user";
import { Subreddit } from "./subreddit";

interface RawSubmission {
    title: string;
    name: string;
    subreddit: string;
    author: string;
    ups: number;
    downs: number;
    created: number;
    edited: number;
    gilded: number;
    subreddit_type: SubredditType;
    domain: string;
    selftext: string;
    archived: boolean;
    over_18: boolean;
    spoiler: boolean;
    hidden: boolean;
    permalink: string;
    stickied: boolean;
    subreddit_subscribers: number;
};

interface RawResult {
    kind: 'Listing',
    data: {
        children: [{
            kind: 't3',
            data: RawSubmission;
        }]
    }
};

export class Submission<Data extends {
    name: string;
    subreddit?: Subreddit;
    comments?: Comment[];
    title?: string;
    author?: RedditUser;
    votes?: {
        up?: number;
        down?: number;
    };
    created?: Date;
    edited?: Date;
    gilded?: number;
    subredditType?: SubredditType;
    domain?: string;
    body?: string;
    archived?: boolean;
    nsfw?: boolean;
    spoiler?: boolean;
    hidden?: boolean;
    permalink?: string;
    stickied?: boolean;
    subscribers?: number;
} = {
    name: string;
    subreddit?: Subreddit;
    comments?: Comment[];
    title?: string;
    author?: RedditUser;
    votes?: {
        up?: number;
        down?: number;
    };
    created?: Date;
    edited?: Date;
    gilded?: number;
    subredditType?: SubredditType;
    domain?: string;
    body?: string;
    archived?: boolean;
    nsfw?: boolean;
    spoiler?: boolean;
    hidden?: boolean;
    permalink?: string;
    stickied?: boolean;
    subscribers?: number;
}> extends RedditContent<Data> {
    public subreddit?: Subreddit;
    public comments?: Comment[];
    public title?: string;
    public author?: RedditUser;
    public votes: { up?: number; down?: number; };
    public created?: Date;
    public edited?: Date;
    public gilded?: number;
    public subredditType?: string;
    public domain?: string;
    public body?: string;
    public archived?: boolean;
    public nsfw?: boolean;
    public spoiler?: boolean;
    public hidden?: boolean;
    public permalink?: string;
    public stickied?: boolean;
    public subscribers?: number;
    
    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);
        this.subreddit = data.subreddit;
        this.comments = data.comments;
        this.title = data.title;
        this.author = data.author;
        this.votes = {
            up: data.votes?.up,
            down: data.votes?.down,
        };
        this.created = data.created;
        this.edited = data.edited;
        this.gilded = data.gilded;
        this.subredditType = data.subredditType;
        this.domain = data.domain;
        this.body = data.body;
        this.archived = data.archived;
        this.nsfw = data.nsfw;
        this.spoiler = data.spoiler;
        this.hidden = data.hidden;
        this.permalink = data.permalink;
        this.stickied = data.stickied;
        this.subscribers = data.subscribers;
    }

    protected get uri() {
        return `api/info/?id=${this.name}`;
    }

    protected async _populate(data: RawResult) {
        const submissionData = (data as RawResult).data.children[0].data;
        const comments = await this._fetch(`r/${submissionData.subreddit}/comments/article`, {
                query: {
                    limit: 1000,
                    showmore: true,
                    article: submissionData.name.substring(3)
                }
            })
            .then(([, comments]: [RawSubmission, RawComment]) => comments.data.children.map(child => child.data));

        return new Submission({
            ...this.data,
            author: new RedditUser({ name: submissionData.author }, this.snooWrapped),
            subreddit: new Subreddit({ name: submissionData.subreddit, subscribers: submissionData.subreddit_subscribers }, this.snooWrapped),
            title: submissionData.title,
            votes: {
                up: submissionData.ups,
                down: submissionData.downs
            },
            created: new Date(submissionData.created),
            edited: new Date(submissionData.edited),
            gilded: submissionData.gilded,
            subredditType: submissionData.subreddit_type,
            domain: submissionData.domain,
            body: submissionData.selftext,
            archived: submissionData.archived,
            nsfw: submissionData.over_18,
            comments: comments.map(comment => new Comment({ name: comment.name }, this.snooWrapped)),
            spoiler: submissionData.spoiler,
            hidden: submissionData.hidden,
            permalink: submissionData.permalink,
            stickied: submissionData.stickied,
        }, this.snooWrapped);
    }

    /**
     * Marks this Submission as NSFW (Not Safe For Work).
     * @example await sW.getSubmission('2np694').markNsfw();
     */
    async markNsfw () {
        return this._fetch('api/marknsfw', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    nsfw: Object.keys(data).length === 0 ? true : false,
                }, this.snooWrapped)
            });
    }

    /**
     * Unmarks this Submission as NSFW (Not Safe For Work).
     * @example await sW.getSubmission('2np694').unmarkNsfw();
     */
     async unmarkNsfw () {
        return this._fetch('api/unmarknsfw', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    nsfw: Object.keys(data).length === 0 ? false : true,
                }, this.snooWrapped);
            });
    }

    /**
     * Locks this Submission, preventing new comments from being posted on it.
     * @example await sW.getSubmission('2np694').lock();
     */
    async lock () {
        return this._fetch('api/lock', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    locked: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }

    /**
     * Unlocks this Submission, allowing comments to be posted on it again.
     * @example await sW.getSubmission('2np694').unlock();
     */
    async unlock () {
        return this._fetch('api/unlock', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    locked: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }

    /**
     * Hides this Submission, preventing it from appearing on most Listings.
     * @example await sW.getSubmission('2np694').hide();
     */
    async hide () {
        return this._fetch('api/hide', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    hidden: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }

    /**
     * Unhides this Submission, allowing it to reappear on most Listings.
     * @example await sW.getSubmission('2np694').unhide();
     */
    async unhide () {
        return this._fetch('api/unhide', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    hidden: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }

    /**
     * Mark a submission as a spoiler.
     * **Note:** This will silently fail if the subreddit has disabled spoilers.
     * @example await sW.getSubmission('2np694').markSpoiler();
     */
    async markSpoiler () {
        return this._fetch('api/spoiler', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    spoiler: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }

    /**
     * Unmark a submission as a spoiler.
     * @example await sW.getSubmission('2np694').unmarkSpoiler();
     */
    async unmarkSpoiler () {
        return this._fetch('api/unspoiler', { method: 'POST', query: { id: this.name } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    spoiler: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }

    /**
     * Stickies this Submission.
     * @param slot The sticky slot to put this submission in; This should be either 1 or 2.
     * @example await sW.getSubmission('2np694').sticky(2);
     */
    async sticky (slot = 1 | 2) {
        return this._fetch('api/set_subreddit_sticky', { query: { id: this.name, num: slot } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    stickied: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }

    /**
     * Unstickies this Submission.
     * @example await sW.getSubmission('2np694').unsticky();
     */
    async unsticky () {
        return this._fetch('api/set_subreddit_sticky', { query: { id: this.name, state: false } })
            .then(data => {
                return new Submission({
                    ...this.data,
                    stickied: Object.keys(data).length === 0 ? true : false
                }, this.snooWrapped);
            });
    }
}
