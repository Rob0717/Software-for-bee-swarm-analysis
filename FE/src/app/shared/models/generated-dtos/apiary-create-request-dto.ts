export type ApiaryCreateRequestDto = {
  /**
  * @description Name of the apiary.
  * @example My apiary
  */
  apiaryName: string;
  /**
  * @description Radius from apiary in km
  * @example 30
  */
  apiaryRadius: number;
  /**
  * @description Latitude
  * @example 12.12345
  */
  latitude: number;
  /**
  * @description Longitude
  * @example 10.12345
  */
  longitude: number;
  /**
  * @description Address of the apiary
  * @example Klatovska 17, Pilsen
  */
  address?: string;
};
