import { SnooWrapped } from "../snoo-wrapped";
import { RedditContent } from "./reddit-content";

type MissingEndpoint = { message: 'Not Found'; error: number; };

interface RawRedditUser {
    name: string;
    id: string;
    verified: boolean;
    is_gold: boolean;
    is_mod: boolean;
    has_verified_email: boolean;
    awardee_karma: number;
    awarder_karma: number;
    link_karma: number;
    comment_karma: number;
    total_karma: number;
    accept_followers: boolean;
    created: number;
};

interface RawResult {
    kind: 't2';
    data: RawRedditUser
};

export class RedditUser<Data extends {
    name: string;
    id?: string;
    isVerified?: boolean;
    isGold?: boolean;
    isMod?: boolean;
    hasVerifiedEmail?: boolean;
    karma?: { awardee?: number; awarder?: number; link?: number; comment?: number; total?: number; };
    acceptsFollowers?: boolean;
    created?: Date;
} = {
    name: string;
    id?: string;
    isVerified?: boolean;
    isGold?: boolean;
    isMod?: boolean;
    hasVerifiedEmail?: boolean;
    karma?: { awardee?: number; awarder?: number; link?: number; comment?: number; total?: number; };
    acceptsFollowers?: boolean;
    created?: Date;
}> extends RedditContent<Data> {
    public id?: string;
    public isVerified?: boolean;
    public isGold?: boolean;
    public isMod?: boolean;
    public hasVerifiedEmail?: boolean;
    public karma?: { awardee?: number; awarder?: number; link?: number; comment?: number; total?: number; };
    public acceptsFollowers?: boolean;
    public created?: Date;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);

        this.id = data.id;
        this.isVerified = data.isVerified;
        this.isGold = data.isGold;
        this.isMod = data.isMod;
        this.hasVerifiedEmail = data.hasVerifiedEmail;
        this.karma = {
            awardee: data.karma?.awardee,
            awarder: data.karma?.awarder,
            link: data.karma?.link,
            comment: data.karma?.comment,
            total: data.karma?.total
        };
        this.acceptsFollowers = data.acceptsFollowers;
        this.created = data.created;
    }

    protected _populate(data: MissingEndpoint | RawResult) {
        if ('error' in data && data.error === 404) return;
        if ('kind' in data && data.kind !== 't2') return;

        const redditUserData = (data as RawResult).data;

        return new RedditUser({
            ...this.data,
            id: redditUserData.id,
            isVerified: redditUserData.verified,
            isGold: redditUserData.is_gold,
            isMod: redditUserData.is_mod,
            hasVerifiedEmail: redditUserData.has_verified_email,
            karma: {
                awardee: redditUserData.awardee_karma,
                awarder: redditUserData.awarder_karma,
                link: redditUserData.link_karma,
                comment: redditUserData.comment_karma,
                total: redditUserData.total_karma
            },
            acceptsFollowers: redditUserData.accept_followers,
            created: new Date(redditUserData.created),
        }, this.snooWrapped);
    }

    protected get uri() {
        return `user/${this.name}/about`;
    }
};