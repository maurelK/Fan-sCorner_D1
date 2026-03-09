import { Module } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { CreatorsController } from './creators.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CreatorsController],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
