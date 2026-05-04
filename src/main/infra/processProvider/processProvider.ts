import { ProcessProvider } from '@/application/interfaces/processProvider';
import { ProcessInfoOsName } from '@common/base/process';
import * as os from 'node:os';

function getCpuUsage(): number {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }
  return { totalIdle, totalTick, count: cpus.length };
}

function computeCpuPercent(prev: ReturnType<typeof getCpuUsage> | null, curr: ReturnType<typeof getCpuUsage>): number {
  if (!prev) {
    return 0;
  }
  const idleDiff = curr.totalIdle - prev.totalIdle;
  const tickDiff = curr.totalTick - prev.totalTick;
  if (tickDiff === 0) {
    return 0;
  }
  return Math.round((1 - idleDiff / tickDiff) * 100);
}

export function createProcessProvider(): ProcessProvider {
  let prevCpu = getCpuUsage();

  return {
    getProcessInfo: () => ({
      browser: {
        name: 'Chrome',
        ver: process.versions.chrome
      },
      os: {
        name: process.platform as ProcessInfoOsName,
        ver: process.getSystemVersion()
      },
      isLinux: process.platform === 'linux',
      isMac: process.platform === 'darwin',
      isWin: process.platform === 'win32',
      isDevMode: process.env.NODE_ENV !== 'production'
    }),
    getSystemMetrics: () => {
      const currCpu = getCpuUsage();
      const cpuUsage = computeCpuPercent(prevCpu, currCpu);
      prevCpu = currCpu;
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      return {
        cpuUsage,
        totalMem,
        freeMem,
        usedMem,
        memUsagePercent: Math.round((usedMem / totalMem) * 100),
      }
    }
  }
}
