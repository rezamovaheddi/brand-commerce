import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';

@Module({
  controllers: [FeaturesController],
  exports: [],
})
export class FeaturesModule {}
