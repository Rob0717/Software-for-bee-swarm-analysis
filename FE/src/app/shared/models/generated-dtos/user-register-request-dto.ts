export type UserRegisterRequestDto = {
  /**
  * @description User name
  * @example Albert
  */
  name: string;
  /**
  * @description User surname
  * @example Einstein
  */
  surname: string;
  /**
  * @description User email
  * @example user@example.com
  */
  email: string;
  /** @example cs */
  language: string;
  /**
  * @description User password
  * @example User1234_
  */
  password: string;
  /**
  * @description User phone number
  * @example +420123456789
  */
  phoneNumber?: string;
  /**
  * @description User address
  * @example Technicka 8, Plzen
  */
  address?: string;
  /**
  * @description User latitude
  * @example 45.12345
  */
  latitude: number;
  /**
  * @description User longitude
  * @example 23.12345
  */
  longitude: number;
};
