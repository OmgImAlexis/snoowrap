import Listing from './Listing';
import VoteableContent from './VoteableContent';

export default class Comment extends VoteableContent<Comment> {
  approved: boolean;
  body_html: string;
  body: string;
  collapsed_reason: any; // ?
  collapsed: boolean;
  controversiality: number;
  depth: number;
  ignore_reports: boolean;
  /** `true` if comment author is the same as the Submission author */
  is_submitter: boolean;
  link_id: string;
  parent_id: string;
  removed: boolean;
  replies: Listing<Comment>;
  score_hidden: boolean;
  spam: boolean;
}
