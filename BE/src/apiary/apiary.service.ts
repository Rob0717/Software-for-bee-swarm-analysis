import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {ApiaryCreateRequestDto} from '@app/apiary/dto/apiary-create-request.dto';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ApiaryEntity} from '@shared/entities/apiary.entity';
import {ApiaryCreateResponseDto} from '@app/apiary/dto/apiary-create-response.dto';
import {UserService} from '@app/user/user.service';

@Injectable()
export class ApiaryService {

  constructor(
    @InjectRepository(ApiaryEntity)
    private _apiaryRepository: Repository<ApiaryEntity>,
    private _userService: UserService
  ) {}

  /**
   * Creates a new apiary and associates it with the given user.
   * Validates apiary name length and radius range before persisting.
   * @param userId - ID of the authenticated user creating the apiary.
   * @param dto - The request payload containing apiary details.
   * @returns A promise resolving to the created apiary response.
   * @throws BadRequestException if name or radius values are out of allowed range.
   * @throws NotFoundException if the user does not exist.
   */
  public async createApiary(userId: number, dto: ApiaryCreateRequestDto): Promise<ApiaryCreateResponseDto> {
    if (dto.apiaryName.length === 0 || dto.apiaryName.length > 60 || dto.apiaryRadius === 0 || dto.apiaryRadius > 1000) {
      throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
    }

    const apiary = this._apiaryRepository.create(dto);
    const user = await this._userService.findOne(userId);
    if (!user) {
      throw new NotFoundException({type: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND'});
    }

    apiary.createdBy = user;

    return this._apiaryRepository.save(apiary)
      .then(apiary => {
        const apiaryResponse: ApiaryCreateResponseDto = {
          id: apiary.id,
          apiaryName: apiary.apiaryName,
          apiaryRadius: apiary.apiaryRadius,
          latitude: apiary.latitude,
          longitude: apiary.longitude,
          address: apiary.address
        };
        return apiaryResponse;
      })
      .catch(() => {
        throw new BadRequestException({type: 'INVALID_REQUEST', code: 'INVALID_REQUEST'});
      });
  }

  /**
   * Retrieves all apiaries belonging to the given user, ordered by ID ascending.
   * @param userId - ID of the authenticated user.
   * @returns A promise resolving to an array of apiary response objects.
   */
  public async getApiariesByUser(userId: number): Promise<ApiaryCreateResponseDto[]> {
    const apiaries = await this._apiaryRepository.find({
      where: {createdBy: {id: userId}},
      order: {id: 'ASC'},
    });

    return apiaries.map(apiary => ({
      id: apiary.id,
      apiaryName: apiary.apiaryName,
      apiaryRadius: apiary.apiaryRadius,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
      address: apiary.address,
    }));
  }

  /**
   * Removes an apiary by its ID.
   * Only the owner of the apiary is allowed to remove it.
   * @param userId - ID of the authenticated user requesting the deletion.
   * @param apiaryId - ID of the apiary to remove.
   * @throws NotFoundException if the apiary does not exist.
   * @throws ForbiddenException if the authenticated user is not the owner of the apiary.
   */
  public async removeApiaryFromUserById(userId: number, apiaryId: number): Promise<void> {
    const apiary = await this._apiaryRepository.findOne({
      where: {id: apiaryId},
      relations: {createdBy: true},
    });

    if (!apiary) {
      throw new NotFoundException({type: 'APIARY_NOT_FOUND', code: 'APIARY_NOT_FOUND'});
    }

    if (apiary.createdBy.id !== userId) {
      throw new ForbiddenException();
    }

    await this._apiaryRepository.remove(apiary);
  }

  /**
   * Retrieves all apiaries created by non-banned users.
   * @returns A promise resolving to an array of apiary entities with their owner relations loaded.
   */
  public async getAllApiaries(): Promise<ApiaryEntity[]> {
    return this._apiaryRepository.find({
      where: {
        createdBy: {banned: false},
      },
      relations: {
        createdBy: true,
      },
    });
  }
}