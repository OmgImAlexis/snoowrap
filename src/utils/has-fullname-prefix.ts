/**
 * Determines whether a string is a "fullname".
 * A "fullname" starts with "t1_", "t2_", ... "t8_", or "LiveUpdateEvent_".
 */
export function hasFullnamePrefix (item: string): boolean {
    return /^(t\d|LiveUpdateEvent)_/.test(item);
};
