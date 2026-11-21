import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { B2bController } from './b2b.controller';
import { B2bService } from './b2b.service';
import { OrgPortalController } from './org-portal.controller';
import { OrgMemberGuard } from './org-member.guard';

@Module({
  imports: [InventoryModule],
  controllers: [B2bController, OrgPortalController],
  providers: [B2bService, OrgMemberGuard],
  exports: [B2bService],
})
export class B2bModule {}
