import {JwtPayload} from '@shared/interfaces/jwt-payload.interface';

export interface PossiblyAuthenticatedRequestInterface extends Request {
  user: JwtPayload | null;
}