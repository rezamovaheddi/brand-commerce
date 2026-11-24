import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  evaluateAllFeatureFlags,
  evaluateFeatureFlag,
  FEATURE_REGISTRY,
  FeatureEvaluationContext,
} from '@bc/domain';

@ApiTags('Features')
@Controller('features')
export class FeaturesController {
  @Get()
  @ApiOperation({
    summary: 'Evaluate and return active feature flags',
    description:
      'Returns active feature flags for clients and cohort rollouts (TASK-196 / OpenFeature abstraction).',
  })
  @ApiResponse({ status: 200, description: 'Active feature flags evaluated against context' })
  getAllFeatures(
    @Headers('x-user-role') role?: string,
    @Headers('x-org-id') orgId?: string,
    @Query('env') env?: 'development' | 'staging' | 'production'
  ) {
    const context: FeatureEvaluationContext = {
      role,
      orgId,
      environment: env || (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
    };

    const flags = evaluateAllFeatureFlags(context);
    return {
      success: true,
      context: {
        role: context.role || 'GUEST',
        environment: context.environment,
      },
      flags,
    };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Evaluate a single feature flag by key' })
  @ApiResponse({ status: 200, description: 'Evaluation result and flag metadata' })
  getFeatureByKey(
    @Param('key') key: string,
    @Headers('x-user-role') role?: string,
    @Headers('x-org-id') orgId?: string,
    @Query('env') env?: 'development' | 'staging' | 'production'
  ) {
    const context: FeatureEvaluationContext = {
      role,
      orgId,
      environment: env || (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
    };

    const isEnabled = evaluateFeatureFlag(key, context);
    const def = FEATURE_REGISTRY[key as keyof typeof FEATURE_REGISTRY];

    return {
      key,
      enabled: isEnabled,
      description: def?.description || 'Dynamic feature flag',
      defaultValue: def?.defaultValue ?? false,
    };
  }
}
