import {Module} from '@nestjs/common';
import {AuthController} from '@app/auth/auth.controller';
import {AuthService} from '@app/auth/auth.service';
import {SharedModule} from '@shared/shared.module';
import {UserModule} from '@app/user/user.module';

@Module({
  controllers: [AuthController],
  imports: [
    SharedModule,
    UserModule
  ],
  providers: [AuthService]
})
export class AuthModule {}
