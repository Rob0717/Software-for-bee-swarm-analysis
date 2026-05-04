import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn, ManyToOne,
} from 'typeorm';
import {ReportStatus} from '@shared/enums/report-status.enum';
import {UserEntity} from '@shared/entities/user.entity';

@Entity()
export class ReportEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  description: string;

  @Column({type: 'varchar', nullable: true})
  photoUrl: string | null;

  @Column({type: 'double'})
  latitude: number;

  @Column({type: 'double'})
  longitude: number;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.NEW
  })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.reports, {nullable: true})
  assignedTo: UserEntity | null;
}
