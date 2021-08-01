import { SnooWrapped } from "../snoowrapped";
import { RedditContent } from "./reddit-content";

export class Subreddit extends RedditContent {
    public subscribers?: number;

    constructor(data: {
        name: string;
        subscribers?: number;
    }, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);

        this.subscribers = data.subscribers;
    }
}