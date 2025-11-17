import { Module } from '@nestjs/common';
import { WebappController } from './webapp.controller';
import { UpworkModule } from '../upwork/upwork.module';

@Module({
  imports: [UpworkModule],
  controllers: [WebappController],
})
export class WebappModule {}

