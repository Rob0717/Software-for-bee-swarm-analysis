export type ChangeReportStatusRequestDto = {
  /**
  * @description Status of the report
  * @example new
  * @example in_progress
  * @example resolved
  * @example rejected
  * @enum {string}
  */
  status: 'new' | 'in_progress' | 'resolved' | 'rejected';
};
