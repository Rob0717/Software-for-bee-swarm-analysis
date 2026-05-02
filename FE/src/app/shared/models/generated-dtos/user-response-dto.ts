export type UserResponseDto = {
  /**
  * @description User ID
  * @example 1
  */
  id: number;
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
  /**
  * @description User phone number
  * @example +420123456789
  */
  phoneNumber?: string | null;
  /**
  * @description User role
  * @example beekeeper
  * @enum {string}
  */
  role: 'admin' | 'beekeeper';
  /**
  * @description User banned status
  * @example false
  */
  banned: boolean;
  /**
  * @description User verified status
  * @example false
  */
  verified: boolean;
  /**
  * @description User address
  * @example Technicka 8, Plzen
  */
  address?: string | null;
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
