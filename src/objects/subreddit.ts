import { SnooWrapper } from "../snoo-wrapper";
import { RedditContent } from "./reddit-content";

export class Subreddit extends RedditContent {
    public subscribers?: number;

    constructor(data: {
        name: string;
        subscribers?: number;
    }, snooWrapper: SnooWrapper) {
        super(data, snooWrapper);

        this.subscribers = data.subscribers;
    }
}
