import { Module } from '@nestjs/common';
import { B2bModule } from '../b2b/b2b.module';
import { SupportModule } from '../support/support.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [B2bModule, SupportModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
