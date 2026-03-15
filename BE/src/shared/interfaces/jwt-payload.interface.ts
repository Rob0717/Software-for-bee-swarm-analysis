import {UserRole} from '@shared/enums/user-role.enum';

export interface JwtPayload {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
}
