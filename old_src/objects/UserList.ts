import { snoowrap } from "../snoowrap";
import { $TSFIXME } from "../ts-fix-me";

export class UserList {
  public readonly _name: string = 'UserList';
  constructor (options: { children: $TSFIXME[] }, _r: snoowrap) {
    // This doesn't work in typescript
    // See https://github.com/microsoft/TypeScript/issues/27594
    // @ts-expect-error
    return options.children.map(user => _r._newObject('RedditUser', user));
  }
}
