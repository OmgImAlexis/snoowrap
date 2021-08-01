import { MissingCredentialsError } from "./errors/missing-credentials-error";
import { RequiredArgumentError } from "./errors/required-argument-erorr";
import { RedditUser } from "./objects/reddit-user";
import { Comment } from "./objects/comment";
import { addFullnamePrefix } from "./utils/add-fullname-prefix";
import { Submission } from "./objects/submission";

type accessToken = {
    accessToken: string;
};
type refreshToken = {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
};
type usernamePassword = {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
};

type Credentials = accessToken | refreshToken | usernamePassword;

export type SnooWrappedOptions = {
    userAgent: string;
} & Credentials;

export class SnooWrapped {
    public readonly userAgent: string;

    #clientId?: string;
    #clientSecret?: string;
    #refreshToken?: string;
    #accessToken?: string;
    #tokenExpiration?: Date;
    #username?: string;
    #password?: string;
    #scope?: string[];

    constructor(options: SnooWrappedOptions) {
        if (!options?.userAgent) throw new RequiredArgumentError('options.userAgent');

        // Convert the credentials type to a partial as the user may not have provided all of the required fields
        const opts = options as SnooWrappedOptions & Partial<accessToken & refreshToken & usernamePassword>;

        // Check options for credentials
        if ((!opts.accessToken || typeof opts.accessToken !== 'string') &&
          (opts.clientId === undefined || opts.clientSecret === undefined || typeof opts.refreshToken !== 'string') &&
          (opts.clientId === undefined || opts.clientSecret === undefined || opts.username === undefined || opts.password === undefined)
        ) {
            throw new MissingCredentialsError();
        }

        // Save user agent
        this.userAgent = opts.userAgent;
    
        // Save credentials
        this.#clientId = opts.clientId;
        this.#clientSecret = opts.clientSecret;
        this.#refreshToken = opts.refreshToken;
        this.#accessToken = opts.accessToken;
        this.#username = opts.username;
        this.#password = opts.password;
    }

    updateAccessToken(accessToken: string, expiration: Date, scope: string[]) {
        this.#accessToken = accessToken;
        this.#tokenExpiration = expiration;
        this.#scope = scope;
    }

    get credentials() {
        return {
            clientId: this.#clientId,
            clientSecret: this.#clientSecret,
            refreshToken: this.#refreshToken,
            accessToken: this.#accessToken,
            tokenExpiration: this.#tokenExpiration,
            scope: this.#scope,
            username: this.#username,
            password: this.#password
        };
    }

    /**
     * Gets information on a Reddit user with a given name.
     * @param name The user's username.
     * @example
     *
     * sW.getUser('OmgImAlexis');
     * // => RedditUser { name: 'OmgImAlexis' }
     * sW.getUser('OmgImAlexis').fetch().then(user => console.log(user.linkKarma));
     * // => 6
     */
    getUser(name: string): RedditUser {
        return new RedditUser({ name: name.replace(/^\/?u\//, '') }, this);
    }

    /**
     * Gets information on a comment with a given ID.
     * @param commentId The base36 ID of the comment.
     * @example
     *
     * sW.getComment('c0b6xx0');
     * // => Comment { name: 't1_c0b6xx0' }
     * sW.getComment('c0b6xx0').fetch().then(comment => console.log(comment.author.name));
     * // => 'Kharos'
     */
    getComment(commentId: string): Comment {
        return new Comment({ name: addFullnamePrefix(commentId, 't1_') }, this);
    }

    /**
     * Gets information on a given submission.
     * @param submissionId The base36 id of the submission.
     * @example
     *
     * sW.getSubmission('2np694');
     * // => Submission { name: 't3_2np694' }
     * sW.getSubmission('2np694').then(submission => console.log(submission.title));
     * // => 'What tasty food would be disgusting if eaten over rice?'
     */
    getSubmission(submissionId: string): Submission {
        return new Submission({ name: addFullnamePrefix(submissionId, 't3_') }, this);
    }
}
