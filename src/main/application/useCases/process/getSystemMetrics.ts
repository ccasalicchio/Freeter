import { ProcessProvider } from '@/application/interfaces/processProvider';

type Deps = {
  processProvider: ProcessProvider;
}

export function createGetSystemMetricsUseCase({ processProvider }: Deps) {
  return function getSystemMetricsUseCase() {
    return processProvider.getSystemMetrics();
  }
}

export type GetSystemMetricsUseCase = ReturnType<typeof createGetSystemMetricsUseCase>;
