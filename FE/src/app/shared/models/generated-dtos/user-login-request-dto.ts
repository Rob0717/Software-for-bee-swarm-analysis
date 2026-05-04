export type UserLoginRequestDto = {
  /**
  * @description User email
  * @example user@example.com
  */
  email: string;
  /**
  * @description User password
  * @example User1234_
  */
  password: string;
  /** @example cs */
  language: string;
};
