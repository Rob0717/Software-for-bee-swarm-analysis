import {forwardRef, Module} from '@nestjs/common';
import {JwtAuthGuard} from '@shared/guards/jwt-auth.guard';
import {RolesGuard} from '@shared/guards/roles.guard';
import {JwtAccessStrategy} from '@shared/strategies/jwt-access.strategy';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {MailService} from '@shared/services/mail.service';
import {UserModule} from '@app/user/user.module';
import {MailTemplateService} from '@shared/services/mail-template.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_SECRET_DURATION')
        },
      }),
    }),
    forwardRef(() => UserModule),
  ],
  providers: [
    JwtAuthGuard,
    JwtAccessStrategy,
    MailService,
    MailTemplateService,
    RolesGuard,
  ],
  exports: [
    JwtAuthGuard,
    JwtAccessStrategy,
    MailService,
    MailTemplateService,
    RolesGuard,
    JwtModule,
  ],
})
export class SharedModule {}
