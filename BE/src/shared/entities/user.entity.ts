import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from 'typeorm';
import {UserRole} from '@shared/enums/user-role.enum';
import {ApiaryEntity} from '@shared/entities/apiary.entity';
import {ReportEntity} from '@shared/entities/report.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({type: 'varchar', unique: true})
  email: string;

  @Column()
  password: string;

  @Column({type: 'varchar', nullable: true})
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BEEKEEPER
  })
  role: UserRole;

  @Column({default: false})
  banned: boolean;

  @Column({default: false})
  verified: boolean;

  @Column({default: false})
  passwordChangeRequested: boolean;

  @Column({default: 'cs'})
  language: string;

  @Column({type: 'bigint', nullable: true})
  passwordChangeRequestedAt: number | null;

  @Column({type: 'varchar', nullable: true})
  address: string | null;

  @Column({type: 'double'})
  latitude: number;

  @Column({type: 'double'})
  longitude: number;

  @OneToMany(() => ApiaryEntity, (apiary) => apiary.createdBy)
  apiaries: ApiaryEntity[];

  @OneToMany(() => ReportEntity, (report) => report.assignedTo)
  reports: ReportEntity[];
}