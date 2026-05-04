import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserModule} from '@app/user/user.module';
import {ReportModule} from '@app/report/report.module';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {AuthModule} from '@app/auth/auth.module';
import {SharedModule} from '@shared/shared.module';
import {AcceptLanguageResolver, I18nModule, QueryResolver} from 'nestjs-i18n';
import {LocationModule} from './location/location.module';
import * as path from 'path';
import {ApiaryModule} from '@app/apiary/apiary.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true}),
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule,
        I18nModule.forRoot({
          fallbackLanguage: 'cs',
          loaderOptions: {
            path: path.join(process.cwd(), 'src', 'i18n'),
            watch: true,
          },
          resolvers: [
            {use: QueryResolver, options: ['lang']},
            AcceptLanguageResolver,
          ],
        }),
      ],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOSTNAME'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
        synchronize: config.get<string>('NODE_ENV') === 'development'
      })
    }),
    UserModule,
    ReportModule,
    AuthModule,
    SharedModule,
    LocationModule,
    ApiaryModule
  ]
})
export class AppModule {}
