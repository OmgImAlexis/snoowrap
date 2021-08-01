import { SnooWrapped } from "../snoo-wrapped";
import { RedditContent } from "./reddit-content";

export class Subreddit<Data extends {
    name: string;
    subscribers?: number;
} = {
    name: string;
    subscribers?: number;
}> extends RedditContent<Data> {
    public subscribers?: number;

    constructor(data: Data, snooWrapped: SnooWrapped) {
        super(data, snooWrapped);

        this.subscribers = data.subscribers;
    }
}