import { SnooWrapper } from "../snoo-wrapper";
import { SubredditType } from "../types";
import { RedditContent } from "./reddit-content";import { RedditUser } from "./reddit-user";
import { Submission } from "./submission";
import { Subreddit } from "./subreddit";

type MissingEndpoint = { message: 'Not Found'; error: number; };

export type RawComment = {
    kind: 'Listing',
    data: {
        children: [{
            kind: 't1',
            data: {
                name: string;
                author: string;
                subreddit: string;
                ups: number;
                downs: number;
                created: number;
                edited: number;
                gilded: number;
                subreddit_type: SubredditType;
                archived: boolean;
                body: string;
                parent_id: string;
            }
        }]
    }
};

export class Comment extends RedditContent {
    public submission?: Submission;
    public body?: string;
    public created?: Date;
    public edited?: Date;
    public gilded?: number;
    public archived?: boolean;
    public subredditType?: SubredditType;
    public subreddit?: Subreddit;
    public author: any;
    public votes: { up?: number; down?: number; };
    
    constructor(data: {
        name: string;
        submission?: Submission;
        subreddit?: Subreddit;
        body?: string;
        created?: Date;
        edited?: Date;
        gilded?: number;
        archived?: boolean;
        subredditType?: SubredditType;
        author?: RedditUser;
        votes?: {
            up?: number;
            down?: number;
        };
    }, snooWrapper: SnooWrapper) {
        super(data, snooWrapper);

        this.submission = data.submission;
        this.subreddit = data.subreddit;
        this.author = data.author;
        this.votes = {
            up: data.votes?.up,
            down: data.votes?.down,
        };
        this.created = data.created;
        this.edited = data.edited;
        this.gilded = data.gilded;
        this.subredditType = data.subredditType;
        this.body = data.body;
        this.archived = data.archived;
    }

    protected _populate(data: MissingEndpoint | RawComment) {
        if ('error' in data && data.error === 404) return;
        if ('kind' in data && data.kind !== 'Listing') return;

        const commentData = (data as RawComment).data.children[0].data;

        return new Comment({
            ...this.data,
            submission: new Submission({ name: commentData.parent_id }, this.snooWrapper),
            author: new RedditUser({ name: commentData.author }, this.snooWrapper),
            subreddit: commentData.subreddit,
            votes: {
                up: commentData.ups,
                down: commentData.downs
            },
            created: new Date(commentData.created),
            edited: new Date(commentData.edited),
            gilded: commentData.gilded,
            subredditType: commentData.subreddit_type,
            body: commentData.body,
            archived: commentData.archived
        }, this.snooWrapper);

        // const submissionData = (data as RawResult)[0].data.children[0].data;

        // return new Comment({
        //     ...this.data,
        //     submission: new Submission({ name: submissionData.name }, this.snooWrapper)
        // }, this.snooWrapper);
    }

    protected get uri() {
        return `api/info/?id=${this.name}`;
    }
}
