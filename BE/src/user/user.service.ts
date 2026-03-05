import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {UserEntity} from '@shared/entities/user.entity';
import {Repository} from 'typeorm';
import {UserRegisterRequestDto} from '@shared/dto/user/user-register-request.dto';
import {UserResponseDto} from '@shared/dto/user/user-response.dto';
import {UserMapper} from '@shared/mappers/user.mapper';
import {UserRole} from '@shared/enums/user-role.enum';
import {ManageUserAccessRequestDto} from '@shared/dto/user/manage-user-access-request.dto';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(UserEntity)
    private _userRepository: Repository<UserEntity>,
    private _userMapper: UserMapper
  ) {}

  /**
   * Finds a single user by ID (number) or email address (string).
   * @param attribute - The user ID or email address to search by.
   * @returns A promise resolving to the matching user entity, or null if not found.
   */
  public async findOne(attribute: string | number): Promise<UserEntity | null> {
    let user: UserEntity | null;

    switch (typeof attribute) {
      case 'number':
        user = await this._userRepository.findOne({where: {id: attribute}});
        break;
      case 'string':
        user = await this._userRepository.findOne({where: {email: attribute}});
        break;
    }

    return user;
  }

  /**
   * Checks whether a user exists by ID (number) or email address (string).
   * @param attribute - The user ID or email address to check.
   * @returns A promise resolving to true if the user exists, false otherwise.
   */
  public async existsOne(attribute: string | number): Promise<boolean> {
    let user: UserEntity | null;

    switch (typeof attribute) {
      case 'number':
        user = await this._userRepository.findOne({where: {id: attribute}});
        break;
      case 'string':
        user = await this._userRepository.findOne({where: {email: attribute}});
    }

    return !!user;
  }

  /**
   * Returns all users with the BEEKEEPER role.
   * @returns A promise resolving to an array of beekeeper user entities.
   */
  public async findAllBeekeepers(): Promise<UserEntity[]> {
    return await this._userRepository.find({where: {role: UserRole.BEEKEEPER}});
  }

  /**
   * Creates a new UserEntity instance from the registration DTO without persisting it.
   * @param dto - The registration payload to create the entity from.
   * @returns The newly created (unsaved) user entity.
   */
  public createOne(dto: UserRegisterRequestDto): UserEntity {
    return this._userRepository.create(dto);
  }

  /**
   * Persists a user entity to the database and returns the mapped response DTO.
   * @param user - The user entity to save.
   * @returns A promise resolving to the saved user response DTO.
   */
  public async saveOne(user: UserEntity): Promise<UserResponseDto> {
    await this._userRepository.save(user);
    return this._userMapper.mapUserEntityToUserResponseDto(user);
  }

  /**
   * Updates specific fields of a user entity by ID.
   * @param id - The ID of the user to update.
   * @param data - A partial user entity containing only the fields to update.
   */
  public async updateOne(id: number, data: Partial<UserEntity>): Promise<void> {
    await this._userRepository.update(id, data);
  }

  /**
   * Bans or unbans a user account.
   * Admins cannot manage other admins or their own account.
   * @param adminId - The ID of the admin performing the action.
   * @param dto - The request payload containing the new access settings.
   * @param id - The ID of the user to manage.
   * @throws NotFoundException if the target user does not exist.
   * @throws ForbiddenException if the admin tries to manage their own account.
   * @throws BadRequestException if the target user is an admin.
   */
  public async manageUserAccess(adminId: number, dto: ManageUserAccessRequestDto, id: number): Promise<void> {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    if (user.id === adminId) {
      throw new ForbiddenException();
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
    }

    await this._userRepository.update(id, {banned: dto.banUser});
  }
}