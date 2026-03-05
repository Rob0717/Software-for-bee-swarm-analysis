export type ReportResponseDto = {
  /**
  * @description Report ID
  * @example 1
  */
  id: number;
  /**
  * @description Report description
  * @example This is the area where bee swarm was found.
  */
  description: string;
  /**
  * @description Filename of the report photo
  * @example report1.jpg
  */
  photoUrl?: string;
  /**
  * @description Latitude
  * @example 49.7384
  */
  latitude: number;
  /**
  * @description Longitude
  * @example 13.3736
  */
  longitude: number;
  /**
  * @description Status of the report
  * @example new
  * @enum {string}
  */
  status: 'new' | 'in_progress' | 'resolved' | 'rejected';
  /**
  * Format: date-time
  * @description Date and time when the report was created
  * @example 2025-07-30T12:34:56.789Z
  */
  createdAt: string;
  /**
  * Format: date-time
  * @description Date and time when the report was last updated
  * @example 2025-07-30T14:00:00.000Z
  */
  updatedAt: string;
  /** @example Karel */
  assignedToUserName?: string;
  /** @example Novák */
  assignedToUserSurname?: string;
};
