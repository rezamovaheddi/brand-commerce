import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { B2bController } from './b2b.controller';
import { B2bService } from './b2b.service';

@Module({
  imports: [InventoryModule],
  controllers: [B2bController],
  providers: [B2bService],
  exports: [B2bService],
})
export class B2bModule {}
