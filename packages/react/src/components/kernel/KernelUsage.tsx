/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useInterval } from 'usehooks-ts';
import {
  Sparklines,
  SparklinesLine,
  SparklinesSpots,
  SparklinesBars,
} from 'react-sparklines';
import { Text, Box } from '@primer/react';
import Kernel from '../../jupyter/kernel/Kernel';

const MAX_ITEMS = 20;

const REQUEST_USAGE = `
import psutil

processes: dict[str, psutil.Process] = {}

def get_process_metric_value(self, process, name, attribute=None):
    """Get the process metric value."""
    try:
        metric_value = getattr(process, name)()
        if attribute is not None:  # ... a named tuple
            return getattr(metric_value, attribute)
        # ... or a number
        return metric_value
    # Avoid littering logs with stack traces
    # complaining about dead processes
    except BaseException:
        return 0

current_process = psutil.Process()
all_processes = [current_process, *current_process.children(recursive=True)]
# Ensure 1) self.processes is updated to only current subprocesses
# and 2) we reuse processes when possible (needed for accurate CPU)
processes = {
    process.pid: processes.get(process.pid, process)  # type:ignore[misc,call-overload]
    for process in all_processes
}
kernel_cpu = sum(
    [
    get_process_metric_value(process, "cpu_percent", None)
    for process in processes.values()
    ]
)
mem_info_type = "pss" if hasattr(current_process.memory_full_info(), "pss") else "rss"
kernel_memory = sum(
    [
    get_process_metric_value(process, "memory_full_info", mem_info_type)
    for process in processes.values()
    ]
)
cpu_percent = psutil.cpu_percent()
# https://psutil.readthedocs.io/en/latest/index.html?highlight=cpu#psutil.cpu_percent
# The first time cpu_percent is called it will return a meaningless 0.0 value which you are supposed to ignore.
if cpu_percent is not None and cpu_percent != 0.0:  # type:ignore[redundant-expr]
    host_cpu_percent = cpu_percent

cpu_count = psutil.cpu_count(logical=True)
host_virtual_memory = dict(psutil.virtual_memory()._asdict())

print(f"""{{
  "kernel_cpu": "{kernel_cpu}",
  "cpu_count": "{cpu_count}",
  "host_virtual_memory": {str(host_virtual_memory)}
}}""")
`;
type Props = {
  kernel?: Kernel;
};

export const KernelUsage = (props: Props) => {
  const { kernel } = props;
  const [usage, setUsage] = useState({});
  const [virtualMemoryTotal, setVirtualMemoryTotal] = useState<number>();
  const [virtualMemoryAvailable, setVirtualMemoryAvailable] = useState(
    new Array<number>(),
  );
  // { "kernel_cpu": "0", "cpu_count": "4", "host_virtual_memory": {"total": 15335940096, "available": 13279002624, "percent": 13.4, "used": 1704222720, "free": 11412717568, "active": 696995840, "inactive": 2084093952, "buffers": 237412352, "cached": 1981587456, "shared": 4796416, "slab": 989294592} }
  const refreshUsage = async () => {
    const result = await kernel!.execute(REQUEST_USAGE)?.result;
    if (result) {
      const usage = JSON.parse(result.replaceAll("'", '"'));
      const v = virtualMemoryAvailable.concat([
        usage['host_virtual_memory']['available'] / 1000,
      ]);
      if (v.length > MAX_ITEMS) {
        v.shift();
      }
      setVirtualMemoryAvailable(v);
      setVirtualMemoryTotal(usage['host_virtual_memory']['total'] / 1000);
      setUsage(usage);
    }
  };
  useEffect(() => {
    kernel?.ready.then(async () => {
      refreshUsage();
    });
  }, [kernel]);
  useInterval(() => {
    if (usage) {
      refreshUsage();
    }
  }, 1000);
  return usage ? (
    <Box>
      <Box>
        <Text>Virtual Memory Available</Text>
      </Box>
      <Box>
        <Sparklines
          data={virtualMemoryAvailable}
          limit={MAX_ITEMS}
          svgHeight={100}
          svgWidth={200}
          min={0}
          max={virtualMemoryTotal}
        >
          <SparklinesBars
            style={{ stroke: 'white', fill: '#41c3f9', fillOpacity: '.25' }}
          />
          <SparklinesLine style={{ stroke: '#41c3f9', fill: 'none' }} />
          <SparklinesSpots />
        </Sparklines>
      </Box>
    </Box>
  ) : (
    <></>
  );
};

export default KernelUsage;
