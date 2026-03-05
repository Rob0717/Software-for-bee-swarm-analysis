import 'reflect-metadata';
import {DataSource} from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOSTNAME,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  migrations: [isProd ? __dirname + '/migrations/*.js' : 'src/migrations/*.ts'],
  entities: [isProd ? __dirname + '/**/*.entity.js' : 'src/**/*.entity.ts'],

  synchronize: false,
  logging: false,
});