import type { ServiceInfo } from '@xgen/api-client';

export type { ServiceInfo };

export interface HealthStats {
  total: number;
  healthy: number;
  unhealthy: number;
  incompatible: number;
}
