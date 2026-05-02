import {UserEntity} from '@shared/entities/user.entity';
import {UserResponseDto} from '@shared/dto/user/user-response.dto';
import {Injectable} from '@nestjs/common';

/**
 * Mapper service responsible for converting UserEntity objects into UserResponseDto objects.
 */
@Injectable()
export class UserMapper {

  /**
   * Maps a single UserEntity to a UserResponseDto.
   * Excludes sensitive fields such as password and internal flags.
   * @param user - The user entity to map.
   * @returns The mapped user response DTO.
   */
  public mapUserEntityToUserResponseDto(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      banned: user.banned,
      verified: user.verified,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
      phoneNumber: user.phoneNumber
    };
  }

  /**
   * Maps an array of UserEntity objects to an array of UserResponseDto objects.
   * @param users - The array of user entities to map.
   * @returns An array of mapped user response DTOs.
   */
  public mapUserEntityArrayToUserResponseDtoArray(users: UserEntity[]): UserResponseDto[] {
    return users.map((user) => this.mapUserEntityToUserResponseDto(user));
  }
}