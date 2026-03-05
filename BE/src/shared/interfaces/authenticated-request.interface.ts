import {JwtPayload} from '@shared/interfaces/jwt-payload.interface';

export interface AuthenticatedUserRequest extends Request {
  user: JwtPayload;
}
