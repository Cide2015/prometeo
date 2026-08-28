import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigController } from './config.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [ConfigController],
})
export class ConfigModule {}
