export type SpamLevels = 'low' | 'high' | 'all';

export type SubredditType = 'public' | 'private' | 'restricted' | 'gold_restricted' | 'gold_only' | 'archived' | 'employees_only';

export type ModLogAction = 'banuser' | 'unbanuser' | 'removelink' | 'approvelink' | 'removecomment' | 'approvecomment' | 'addmoderator' | 'invitemoderator' | 'uninvitemoderator' | 'acceptmoderatorinvite' | 'removemoderator' | 'addcontributor' | 'removecontributor' | 'editsettings' | 'editflair' | 'distinguish' | 'marknsfw' | 'wikibanned' | 'wikicontributor' | 'wikiunbanned' | 'wikipagelisted' | 'removewikicontributor' | 'wikirevise' | 'wikipermlevel' | 'ignorereports' | 'unignorereports' | 'setpermissions' | 'setsuggestedsort' | 'sticky' | 'unsticky' | 'setcontestmode' | 'unsetcontestmode' | 'lock' | 'unlock' | 'muteuser' | 'unmuteuser' | 'createrule' | 'editrule' | 'deleterule' | 'spoiler' | 'unspoiler';

export type CommentSort = 'confidence' | 'top' | 'new' | 'controversial' | 'old' | 'random' | 'qa';