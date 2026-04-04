import type { SystemData, CPUInfo, MemoryInfo, GPUInfo, NetworkInfo, DiskInfo, ResourceStatus } from '@xgen/api-client';

export type { SystemData, CPUInfo, MemoryInfo, GPUInfo, NetworkInfo, DiskInfo, ResourceStatus };

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface HistoryEntry {
  timestamp: number;
  cpu: number;
  memory: number;
  gpu?: number;
}
