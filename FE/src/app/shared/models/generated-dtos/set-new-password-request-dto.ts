export type SetNewPasswordRequestDto = {
  /** @example abcdef123456 */
  token: string;
  /** @example Test12345_ */
  newPassword: string;
};
