import { SubredditType } from ".";
import { Subreddit } from "../objects";
import { $TSFIXME } from "../ts-fix-me";

/**
 * This is the submission raw from the Reddit API.
 */
export interface UnprocessedSubmission {
    
}

/**
 * This is the submission after fetching.
 * @example
 * new Submission({ subreddit: 'all',  }, snoowrap, false).fetch();
 */
export interface FetchedSubmission {
    approved_at_utc: null | string;
    subreddit: Subreddit;
    selftext: string;
    user_reports: $TSFIXME[];
    saved: boolean;
    mod_reason_title: string | null;
    gilded: number;
    clicked: boolean;
    title: string;
    link_flair_richtext: string[];
    subreddit_name_prefixed: string;
    hidden: boolean;
    pwls: number;
    link_flair_css_class: string | null;
    downs: number;
    thumbnail_height: number;
    top_awarded_type: $TSFIXME;
    parent_whitelist_status: $TSFIXME;
    hide_score: boolean;
    name: string;
    quarantine: boolean;
    link_flair_text_color: $TSFIXME;
    upvote_ratio: number;
    author_flair_background_color: null;
    subreddit_type: SubredditType;
    ups: number;
    total_awards_received: number;
    media_embed: $TSFIXME;
    thumbnail_width: number;
    author_flair_template_id: null;
    is_original_content: boolean;
    author_fullname: string;
    secure_media: null;
    is_reddit_media_domain: boolean;
    is_meta: boolean;
    category: null;
    secure_media_embed: $TSFIXME;
    link_flair_text: null;
    can_mod_post: boolean;
    score: number;
    approved_by: null;
    is_created_from_ads_ui: boolean;
    author_premium: boolean;
    thumbnail: string;
    edited: boolean;
    author_flair_css_class: null;
    author_flair_richtext: $TSFIXME[];
    gildings: Record<string, number>;
    post_hint: $TSFIXME;
    content_categories: string[];
    is_self: boolean;
    mod_note: null;
    created: number;
    link_flair_type: $TSFIXME;
    wls: $TSFIXME;
    removed_by_category: null;
    banned_by: null;
    author_flair_type: $TSFIXME;
    domain: string;
    allow_live_comments: boolean;
    selftext_html: string;
    likes: null;
    suggested_sort: null;
    banned_at_utc: number | null;
    url_overridden_by_dest: string;
    view_count: null;
    archived: boolean;
    no_follow: boolean;
    is_crosspostable: boolean;
    pinned: boolean;
    over_18: boolean;
    preview: {
        "images": [
            {
                "source": {
                    "url": "https://external-preview.redd.it/E4GiviOK4ywSv2AudYJ2uf9uXtfHWX0IkQ_iviKtArg.jpg?auto=webp&amp;s=f9f9830084f458820ffd5a1f4c44f77755f338ba";
                    "width": 2000;
                    "height": 1500
                };
                "resolutions": [
                    {
                        "url": "https://external-preview.redd.it/E4GiviOK4ywSv2AudYJ2uf9uXtfHWX0IkQ_iviKtArg.jpg?width=108&amp;crop=smart&amp;auto=webp&amp;s=371ce7ce1047f5b12cc0eb3f60cb9325179dae7f";
                        "width": 108;
                        "height": 81
                    };
                    {
                        "url": "https://external-preview.redd.it/E4GiviOK4ywSv2AudYJ2uf9uXtfHWX0IkQ_iviKtArg.jpg?width=216&amp;crop=smart&amp;auto=webp&amp;s=085ecbfae481b496a4e79ff4c2345660552708da";
                        "width": 216;
                        "height": 162
                    };
                    {
                        "url": "https://external-preview.redd.it/E4GiviOK4ywSv2AudYJ2uf9uXtfHWX0IkQ_iviKtArg.jpg?width=320&amp;crop=smart&amp;auto=webp&amp;s=dc0fdf74dcbcf938057814681f2215c1848fd0d2";
                        "width": 320;
                        "height": 240
                    };
                    {
                        "url": "https://external-preview.redd.it/E4GiviOK4ywSv2AudYJ2uf9uXtfHWX0IkQ_iviKtArg.jpg?width=640&amp;crop=smart&amp;auto=webp&amp;s=8516288f9c95eaef5b81124aea5aae1ad04a3a2b";
                        "width": 640;
                        "height": 480
                    };
                    {
                        "url": "https://external-preview.redd.it/E4GiviOK4ywSv2AudYJ2uf9uXtfHWX0IkQ_iviKtArg.jpg?width=960&amp;crop=smart&amp;auto=webp&amp;s=196ebf7a60dc64f5c9798e4d3a2e5992b632b44d";
                        "width": 960;
                        "height": 720
                    };
                    {
                        "url": "https://external-preview.redd.it/E4GiviOK4ywSv2AudYJ2uf9uXtfHWX0IkQ_iviKtArg.jpg?width=1080&amp;crop=smart&amp;auto=webp&amp;s=66bd879f248cb1621467985945322eacaffc184a";
                        "width": 1080;
                        "height": 810
                    }
                ];
                "variants": {};
                "id": "b1UxYOlQn0n-cM2vddblxvnUqX7PU7P4001WIcf9WjU"
            }
        ];
        "enabled": boolean
    };
    "all_awardings": [
        {
            "giver_coin_reward": null;
            "subreddit_id": null;
            "is_new": boolean;
            "days_of_drip_extension": 0;
            "coin_price": 250;
            "id": "award_9583d210-a7d0-4f3c-b0c7-369ad579d3d4";
            "penny_donate": null;
            "coin_reward": 100;
            "icon_url": "https://i.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png";
            "days_of_premium": 0;
            "icon_height": 2048;
            "tiers_by_required_awardings": null;
            "resized_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=16&amp;height=16&amp;auto=webp&amp;s=3429167a3ea031ab4a4574baf47b2140c7b59aa8";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=32&amp;height=32&amp;auto=webp&amp;s=835353c87c6a5d516662bb681d0d50647e7ab44f";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=48&amp;height=48&amp;auto=webp&amp;s=a925fdb8ed532e7261b0dbc820e691423cba8ee6";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=64&amp;height=64&amp;auto=webp&amp;s=1d86da7e5837d52fec767aeb6a762caff5f7cef0";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=128&amp;height=128&amp;auto=webp&amp;s=e3254651db548741c58f331e91395b55a557573d";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_width": 2048;
            "static_icon_width": 2048;
            "start_date": null;
            "is_enabled": boolean;
            "awardings_required_to_grant_benefits": null;
            "description": "When a thing immediately combusts your brain. Gives %{coin_symbol}100 Coins to both the author and the community.";
            "end_date": null;
            "subreddit_coin_reward": 100;
            "count": 1;
            "static_icon_height": 2048;
            "name": "Mind Blown";
            "resized_static_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=16&amp;height=16&amp;auto=webp&amp;s=3429167a3ea031ab4a4574baf47b2140c7b59aa8";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=32&amp;height=32&amp;auto=webp&amp;s=835353c87c6a5d516662bb681d0d50647e7ab44f";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=48&amp;height=48&amp;auto=webp&amp;s=a925fdb8ed532e7261b0dbc820e691423cba8ee6";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=64&amp;height=64&amp;auto=webp&amp;s=1d86da7e5837d52fec767aeb6a762caff5f7cef0";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png?width=128&amp;height=128&amp;auto=webp&amp;s=e3254651db548741c58f331e91395b55a557573d";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_format": null;
            "award_sub_type": "APPRECIATION";
            "penny_price": null;
            "award_type": "global";
            "static_icon_url": "https://i.redd.it/award_images/t5_22cerq/wa987k0p4v541_MindBlown.png"
        };
        {
            "giver_coin_reward": null;
            "subreddit_id": null;
            "is_new": boolean;
            "days_of_drip_extension": 0;
            "coin_price": 300;
            "id": "award_68ba1ee3-9baf-4252-be52-b808c1e8bdc4";
            "penny_donate": null;
            "coin_reward": 250;
            "icon_url": "https://i.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png";
            "days_of_premium": 0;
            "icon_height": 2048;
            "tiers_by_required_awardings": {
                "0": {
                    "resized_static_icons": [
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=16&amp;height=16&amp;auto=webp&amp;s=9c0a85437357b987e50ba727b67fcc53b0950c95";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=32&amp;height=32&amp;auto=webp&amp;s=773692cd146e84fddcc3d192b6ebb7e0ff8fa8bb";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=48&amp;height=48&amp;auto=webp&amp;s=597adeb2d7ab45cc61a726b7c7d6877d264ee33d";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=64&amp;height=64&amp;auto=webp&amp;s=886636fb2fc59fc1c9a5e2d05cb3f2e0d42714b6";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=128&amp;height=128&amp;auto=webp&amp;s=28657eedaaa67c90c4b4a97d134fe607bb92c975";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "resized_icons": [
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=16&amp;height=16&amp;auto=webp&amp;s=9c0a85437357b987e50ba727b67fcc53b0950c95";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=32&amp;height=32&amp;auto=webp&amp;s=773692cd146e84fddcc3d192b6ebb7e0ff8fa8bb";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=48&amp;height=48&amp;auto=webp&amp;s=597adeb2d7ab45cc61a726b7c7d6877d264ee33d";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=64&amp;height=64&amp;auto=webp&amp;s=886636fb2fc59fc1c9a5e2d05cb3f2e0d42714b6";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=128&amp;height=128&amp;auto=webp&amp;s=28657eedaaa67c90c4b4a97d134fe607bb92c975";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "static_icon": {
                        "url": "https://i.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png";
                        "width": 2048;
                        "height": 2048;
                        "format": null
                    };
                    "awardings_required": 0;
                    "icon": {
                        "url": "https://i.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png";
                        "width": 2048;
                        "height": 2048;
                        "format": "PNG"
                    }
                };
                "3": {
                    "resized_static_icons": [
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=16&amp;height=16&amp;auto=webp&amp;s=c03d4f83daf03bfc8a4341e2ad6b5a6d3c471cfe";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=32&amp;height=32&amp;auto=webp&amp;s=8a5328341618fe60ccb2b1ddd32561975793204a";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=48&amp;height=48&amp;auto=webp&amp;s=957b055444fd6231afb60b58aa95fe74505554f1";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=64&amp;height=64&amp;auto=webp&amp;s=e4a23a37adf97381673eac6bdd7a52ebc69f8fe4";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=128&amp;height=128&amp;auto=webp&amp;s=092eed0465f28509f0ab7e9a56cdbf826b812555";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "resized_icons": [
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=16&amp;height=16&amp;auto=webp&amp;s=c03d4f83daf03bfc8a4341e2ad6b5a6d3c471cfe";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=32&amp;height=32&amp;auto=webp&amp;s=8a5328341618fe60ccb2b1ddd32561975793204a";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=48&amp;height=48&amp;auto=webp&amp;s=957b055444fd6231afb60b58aa95fe74505554f1";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=64&amp;height=64&amp;auto=webp&amp;s=e4a23a37adf97381673eac6bdd7a52ebc69f8fe4";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png?width=128&amp;height=128&amp;auto=webp&amp;s=092eed0465f28509f0ab7e9a56cdbf826b812555";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "static_icon": {
                        "url": "https://i.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png";
                        "width": 2048;
                        "height": 2048;
                        "format": null
                    };
                    "awardings_required": 3;
                    "icon": {
                        "url": "https://i.redd.it/award_images/t5_q0gj4/h9u2ml36hqq51_ThisGold.png";
                        "width": 2048;
                        "height": 2048;
                        "format": "PNG"
                    }
                };
                "6": {
                    "resized_static_icons": [
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/yx7ed010fqq51_ThisPlatinum.png?width=16&amp;height=16&amp;auto=webp&amp;s=76f2f547bdbbf86d19102099ccc024277c7673ef";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/yx7ed010fqq51_ThisPlatinum.png?width=32&amp;height=32&amp;auto=webp&amp;s=3cc88e042abbb716b059f9f3c2d58b8667fc5e03";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/yx7ed010fqq51_ThisPlatinum.png?width=48&amp;height=48&amp;auto=webp&amp;s=63ce35d010ce32d32a15d792a32cba39f7b95519";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/yx7ed010fqq51_ThisPlatinum.png?width=64&amp;height=64&amp;auto=webp&amp;s=ddb817cacf22f2ee855e7263445b8613e8f2a718";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/yx7ed010fqq51_ThisPlatinum.png?width=128&amp;height=128&amp;auto=webp&amp;s=39ff319c1aab711b02f581a4b36ecf2663c72463";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "resized_icons": [
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_platinum_16.png";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_platinum_32.png";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_platinum_48.png";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_platinum_64.png";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_platinum_128.png";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "static_icon": {
                        "url": "https://i.redd.it/award_images/t5_q0gj4/yx7ed010fqq51_ThisPlatinum.png";
                        "width": 2048;
                        "height": 2048;
                        "format": null
                    };
                    "awardings_required": 6;
                    "icon": {
                        "url": "https://www.redditstatic.com/gold/awards/icon/This_platinum_512.png";
                        "width": 2048;
                        "height": 2048;
                        "format": "APNG"
                    }
                };
                "9": {
                    "resized_static_icons": [
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/ceeqdqlwgqq51_ThisArgentium.jpg?width=16&amp;height=16&amp;auto=webp&amp;s=cc2d64c1d075d5b56c271e18fa12a2065051431b";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/ceeqdqlwgqq51_ThisArgentium.jpg?width=32&amp;height=32&amp;auto=webp&amp;s=2c7203ff6dd93cbacb44c22f924fd158711a3329";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/ceeqdqlwgqq51_ThisArgentium.jpg?width=48&amp;height=48&amp;auto=webp&amp;s=e5b8f3d232381249734ebd76dd5321d8f291944a";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/ceeqdqlwgqq51_ThisArgentium.jpg?width=64&amp;height=64&amp;auto=webp&amp;s=e5cb76cb109d814185fa542e357c5c0e9aa5036b";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://preview.redd.it/award_images/t5_q0gj4/ceeqdqlwgqq51_ThisArgentium.jpg?width=128&amp;height=128&amp;auto=webp&amp;s=3359c9a307d45b81b095996d03c4ab512cb098a1";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "resized_icons": [
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_argentium_16.png";
                            "width": 16;
                            "height": 16
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_argentium_32.png";
                            "width": 32;
                            "height": 32
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_argentium_48.png";
                            "width": 48;
                            "height": 48
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_argentium_64.png";
                            "width": 64;
                            "height": 64
                        };
                        {
                            "url": "https://www.redditstatic.com/gold/awards/icon/This_argentium_128.png";
                            "width": 128;
                            "height": 128
                        }
                    ];
                    "static_icon": {
                        "url": "https://i.redd.it/award_images/t5_q0gj4/ceeqdqlwgqq51_ThisArgentium.jpg";
                        "width": 2048;
                        "height": 2048;
                        "format": null
                    };
                    "awardings_required": 9;
                    "icon": {
                        "url": "https://www.redditstatic.com/gold/awards/icon/This_argentium_512.png";
                        "width": 2048;
                        "height": 2048;
                        "format": "APNG"
                    }
                }
            };
            "resized_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=16&amp;height=16&amp;auto=webp&amp;s=9c0a85437357b987e50ba727b67fcc53b0950c95";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=32&amp;height=32&amp;auto=webp&amp;s=773692cd146e84fddcc3d192b6ebb7e0ff8fa8bb";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=48&amp;height=48&amp;auto=webp&amp;s=597adeb2d7ab45cc61a726b7c7d6877d264ee33d";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=64&amp;height=64&amp;auto=webp&amp;s=886636fb2fc59fc1c9a5e2d05cb3f2e0d42714b6";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=128&amp;height=128&amp;auto=webp&amp;s=28657eedaaa67c90c4b4a97d134fe607bb92c975";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_width": 2048;
            "static_icon_width": 2048;
            "start_date": null;
            "is_enabled": boolean;
            "awardings_required_to_grant_benefits": 3;
            "description": "THIS right here! Join together to give multiple This awards and see the award evolve in its display and shower benefits for the recipient. For every 3 This awards given to a post or comment; the author will get 250 coins.";
            "end_date": null;
            "subreddit_coin_reward": 0;
            "count": 1;
            "static_icon_height": 2048;
            "name": "This";
            "resized_static_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=16&amp;height=16&amp;auto=webp&amp;s=9c0a85437357b987e50ba727b67fcc53b0950c95";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=32&amp;height=32&amp;auto=webp&amp;s=773692cd146e84fddcc3d192b6ebb7e0ff8fa8bb";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=48&amp;height=48&amp;auto=webp&amp;s=597adeb2d7ab45cc61a726b7c7d6877d264ee33d";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=64&amp;height=64&amp;auto=webp&amp;s=886636fb2fc59fc1c9a5e2d05cb3f2e0d42714b6";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png?width=128&amp;height=128&amp;auto=webp&amp;s=28657eedaaa67c90c4b4a97d134fe607bb92c975";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_format": null;
            "award_sub_type": "GROUP";
            "penny_price": null;
            "award_type": "global";
            "static_icon_url": "https://i.redd.it/award_images/t5_22cerq/vu6om0xnb7e41_This.png"
        };
        {
            "giver_coin_reward": null;
            "subreddit_id": null;
            "is_new": boolean;
            "days_of_drip_extension": 0;
            "coin_price": 150;
            "id": "award_f44611f1-b89e-46dc-97fe-892280b13b82";
            "penny_donate": null;
            "coin_reward": 0;
            "icon_url": "https://i.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png";
            "days_of_premium": 0;
            "icon_height": 2048;
            "tiers_by_required_awardings": null;
            "resized_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=16&amp;height=16&amp;auto=webp&amp;s=a5662dfbdb402bf67866c050aa76c31c147c2f45";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=32&amp;height=32&amp;auto=webp&amp;s=a6882eb3f380e8e88009789f4d0072e17b8c59f1";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=48&amp;height=48&amp;auto=webp&amp;s=e50064b090879e8a0b55e433f6ee61d5cb5fbe1d";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=64&amp;height=64&amp;auto=webp&amp;s=8e5bb2e76683cb6b161830bcdd9642049d6adc11";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=128&amp;height=128&amp;auto=webp&amp;s=eda4a9246f95f42ee6940cc0ec65306fd20de878";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_width": 2048;
            "static_icon_width": 2048;
            "start_date": null;
            "is_enabled": boolean;
            "awardings_required_to_grant_benefits": null;
            "description": "Thank you stranger. Shows the award.";
            "end_date": null;
            "subreddit_coin_reward": 0;
            "count": 7;
            "static_icon_height": 2048;
            "name": "Helpful";
            "resized_static_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=16&amp;height=16&amp;auto=webp&amp;s=a5662dfbdb402bf67866c050aa76c31c147c2f45";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=32&amp;height=32&amp;auto=webp&amp;s=a6882eb3f380e8e88009789f4d0072e17b8c59f1";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=48&amp;height=48&amp;auto=webp&amp;s=e50064b090879e8a0b55e433f6ee61d5cb5fbe1d";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=64&amp;height=64&amp;auto=webp&amp;s=8e5bb2e76683cb6b161830bcdd9642049d6adc11";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png?width=128&amp;height=128&amp;auto=webp&amp;s=eda4a9246f95f42ee6940cc0ec65306fd20de878";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_format": null;
            "award_sub_type": "GLOBAL";
            "penny_price": null;
            "award_type": "global";
            "static_icon_url": "https://i.redd.it/award_images/t5_22cerq/klvxk1wggfd41_Helpful.png"
        };
        {
            "giver_coin_reward": null;
            "subreddit_id": null;
            "is_new": boolean;
            "days_of_drip_extension": 0;
            "coin_price": 125;
            "id": "award_5f123e3d-4f48-42f4-9c11-e98b566d5897";
            "penny_donate": null;
            "coin_reward": 0;
            "icon_url": "https://i.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png";
            "days_of_premium": 0;
            "icon_height": 2048;
            "tiers_by_required_awardings": null;
            "resized_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=16&amp;height=16&amp;auto=webp&amp;s=92932f465d58e4c16b12b6eac4ca07d27e3d11c0";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=32&amp;height=32&amp;auto=webp&amp;s=d11484a208d68a318bf9d4fcf371171a1cb6a7ef";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=48&amp;height=48&amp;auto=webp&amp;s=febdf28b6f39f7da7eb1365325b85e0bb49a9f63";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=64&amp;height=64&amp;auto=webp&amp;s=b4406a2d88bf86fa3dc8a45aacf7e0c7bdccc4fb";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=128&amp;height=128&amp;auto=webp&amp;s=19555b13e3e196b62eeb9160d1ac1d1b372dcb0b";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_width": 2048;
            "static_icon_width": 2048;
            "start_date": null;
            "is_enabled": boolean;
            "awardings_required_to_grant_benefits": null;
            "description": "When you come across a feel-good thing.";
            "end_date": null;
            "subreddit_coin_reward": 0;
            "count": 10;
            "static_icon_height": 2048;
            "name": "Wholesome";
            "resized_static_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=16&amp;height=16&amp;auto=webp&amp;s=92932f465d58e4c16b12b6eac4ca07d27e3d11c0";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=32&amp;height=32&amp;auto=webp&amp;s=d11484a208d68a318bf9d4fcf371171a1cb6a7ef";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=48&amp;height=48&amp;auto=webp&amp;s=febdf28b6f39f7da7eb1365325b85e0bb49a9f63";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=64&amp;height=64&amp;auto=webp&amp;s=b4406a2d88bf86fa3dc8a45aacf7e0c7bdccc4fb";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png?width=128&amp;height=128&amp;auto=webp&amp;s=19555b13e3e196b62eeb9160d1ac1d1b372dcb0b";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_format": null;
            "award_sub_type": "GLOBAL";
            "penny_price": null;
            "award_type": "global";
            "static_icon_url": "https://i.redd.it/award_images/t5_22cerq/5izbv4fn0md41_Wholesome.png"
        };
        {
            "giver_coin_reward": null;
            "subreddit_id": null;
            "is_new": boolean;
            "days_of_drip_extension": 0;
            "coin_price": 100;
            "id": "gid_1";
            "penny_donate": null;
            "coin_reward": 0;
            "icon_url": "https://www.redditstatic.com/gold/awards/icon/silver_512.png";
            "days_of_premium": 0;
            "icon_height": 512;
            "tiers_by_required_awardings": null;
            "resized_icons": [
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_16.png";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_32.png";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_48.png";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_64.png";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_128.png";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_width": 512;
            "static_icon_width": 512;
            "start_date": null;
            "is_enabled": boolean;
            "awardings_required_to_grant_benefits": null;
            "description": "Shows the Silver Award... and that's it.";
            "end_date": null;
            "subreddit_coin_reward": 0;
            "count": 10;
            "static_icon_height": 512;
            "name": "Silver";
            "resized_static_icons": [
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_16.png";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_32.png";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_48.png";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_64.png";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://www.redditstatic.com/gold/awards/icon/silver_128.png";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_format": null;
            "award_sub_type": "GLOBAL";
            "penny_price": null;
            "award_type": "global";
            "static_icon_url": "https://www.redditstatic.com/gold/awards/icon/silver_512.png"
        };
        {
            "giver_coin_reward": 0;
            "subreddit_id": null;
            "is_new": boolean;
            "days_of_drip_extension": 0;
            "coin_price": 100;
            "id": "award_b4072731-c0fb-4440-adc7-1063d6a5e6a0";
            "penny_donate": 0;
            "coin_reward": 0;
            "icon_url": "https://i.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png";
            "days_of_premium": 0;
            "icon_height": 2048;
            "tiers_by_required_awardings": null;
            "resized_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=16&amp;height=16&amp;auto=webp&amp;s=8e644eb9ffccee5f11d72e759883a6c825f7d89e";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=32&amp;height=32&amp;auto=webp&amp;s=c49ad07c88610c7efe98a54453d9ce5ddf887a1d";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=48&amp;height=48&amp;auto=webp&amp;s=80eb767a877a78c181af1385c2ed98f067b38092";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=64&amp;height=64&amp;auto=webp&amp;s=b2b65ceeff9933f5e70387893e661b7e9f1f1556";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=128&amp;height=128&amp;auto=webp&amp;s=aec3cf53a1aeabe4c2ecc4ad83b2d0f2993d1afd";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_width": 2048;
            "static_icon_width": 2048;
            "start_date": null;
            "is_enabled": boolean;
            "awardings_required_to_grant_benefits": null;
            "description": "C'est magnifique";
            "end_date": null;
            "subreddit_coin_reward": 0;
            "count": 1;
            "static_icon_height": 2048;
            "name": "Masterpiece";
            "resized_static_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=16&amp;height=16&amp;auto=webp&amp;s=8e644eb9ffccee5f11d72e759883a6c825f7d89e";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=32&amp;height=32&amp;auto=webp&amp;s=c49ad07c88610c7efe98a54453d9ce5ddf887a1d";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=48&amp;height=48&amp;auto=webp&amp;s=80eb767a877a78c181af1385c2ed98f067b38092";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=64&amp;height=64&amp;auto=webp&amp;s=b2b65ceeff9933f5e70387893e661b7e9f1f1556";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png?width=128&amp;height=128&amp;auto=webp&amp;s=aec3cf53a1aeabe4c2ecc4ad83b2d0f2993d1afd";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_format": "PNG";
            "award_sub_type": "GLOBAL";
            "penny_price": 0;
            "award_type": "global";
            "static_icon_url": "https://i.redd.it/award_images/t5_22cerq/2juh333m40n51_Masterpiece.png"
        };
        {
            "giver_coin_reward": 0;
            "subreddit_id": null;
            "is_new": boolean;
            "days_of_drip_extension": 0;
            "coin_price": 80;
            "id": "award_8352bdff-3e03-4189-8a08-82501dd8f835";
            "penny_donate": 0;
            "coin_reward": 0;
            "icon_url": "https://i.redd.it/award_images/t5_q0gj4/ks45ij6w05f61_oldHugz.png";
            "days_of_premium": 0;
            "icon_height": 2048;
            "tiers_by_required_awardings": null;
            "resized_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/ks45ij6w05f61_oldHugz.png?width=16&amp;height=16&amp;auto=webp&amp;s=73a23bf7f08b633508dedf457f2704c522b94a04";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/ks45ij6w05f61_oldHugz.png?width=32&amp;height=32&amp;auto=webp&amp;s=50f2f16e71d2929e3d7275060af3ad6b851dbfb1";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/ks45ij6w05f61_oldHugz.png?width=48&amp;height=48&amp;auto=webp&amp;s=ca487311563425e195699a4d7e4c57a98cbfde8b";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/ks45ij6w05f61_oldHugz.png?width=64&amp;height=64&amp;auto=webp&amp;s=7b4eedcffb1c09a826e7837532c52979760f1d2b";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/ks45ij6w05f61_oldHugz.png?width=128&amp;height=128&amp;auto=webp&amp;s=e4d5ab237eb71a9f02bb3bf9ad5ee43741918d6c";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_width": 2048;
            "static_icon_width": 2048;
            "start_date": null;
            "is_enabled": boolean;
            "awardings_required_to_grant_benefits": null;
            "description": "Everything is better with a good hug";
            "end_date": null;
            "subreddit_coin_reward": 0;
            "count": 7;
            "static_icon_height": 2048;
            "name": "Hugz";
            "resized_static_icons": [
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/fpm0r5ryq1361_PolarHugs.png?width=16&amp;height=16&amp;auto=webp&amp;s=69997ace3ef4ffc099b81d774c2c8f1530602875";
                    "width": 16;
                    "height": 16
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/fpm0r5ryq1361_PolarHugs.png?width=32&amp;height=32&amp;auto=webp&amp;s=e9519d1999ef9dce5c8a9f59369cb92f52d95319";
                    "width": 32;
                    "height": 32
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/fpm0r5ryq1361_PolarHugs.png?width=48&amp;height=48&amp;auto=webp&amp;s=f076c6434fb2d2f9075991810fd845c40fa73fc6";
                    "width": 48;
                    "height": 48
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/fpm0r5ryq1361_PolarHugs.png?width=64&amp;height=64&amp;auto=webp&amp;s=85527145e0c4b754306a30df29e584fd16187636";
                    "width": 64;
                    "height": 64
                };
                {
                    "url": "https://preview.redd.it/award_images/t5_q0gj4/fpm0r5ryq1361_PolarHugs.png?width=128&amp;height=128&amp;auto=webp&amp;s=b8843cdf82c3b741d7af057c14076dcd2621e811";
                    "width": 128;
                    "height": 128
                }
            ];
            "icon_format": "PNG";
            "award_sub_type": "GLOBAL";
            "penny_price": 0;
            "award_type": "global";
            "static_icon_url": "https://i.redd.it/award_images/t5_q0gj4/fpm0r5ryq1361_PolarHugs.png"
        }
    ];
    awarders: $TSFIXME[];
    media_only: boolean;
    can_gild: boolean;
    spoiler: boolean;
    locked: boolean;
    author_flair_text: null;
    treatment_tags: [];
    visited: boolean;
    removed_by: null;
    num_reports: null;
    distinguished: null;
    subreddit_id: string;
    author_is_blocked: boolean;
    mod_reason_by: null;
    removal_reason: null;
    link_flair_background_color: string;
    id: string;
    is_robot_indexable: boolean;
    num_duplicates: number;
    report_reasons: null;
    author: string;
    discussion_type: null;
    num_comments: number;
    send_replies: boolean;
    media: null;
    contest_mode: boolean;
    author_patreon_flair: boolean;
    author_flair_text_color: null;
    permalink: string;
    whitelist_status: $TSFIXME;
    stickied: boolean;
    url: string;
    subreddit_subscribers: number;
    created_utc: number;
    num_crossposts: number;
    mod_reports: $TSFIXME[];
    is_video: boolean;
}