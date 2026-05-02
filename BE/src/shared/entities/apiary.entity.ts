import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {UserEntity} from '@shared/entities/user.entity';

@Entity()
export class ApiaryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  apiaryName: string;

  @Column({type: 'integer'})
  apiaryRadius: number;

  @Column({type: 'double'})
  latitude: number;

  @Column({type: 'double'})
  longitude: number;

  @Column({type: 'varchar', nullable: true})
  address: string | null;

  @ManyToOne(() => UserEntity, (user) => user.apiaries)
  createdBy: UserEntity;
}