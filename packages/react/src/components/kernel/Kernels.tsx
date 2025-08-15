/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { Table, DataTable, Blankslate } from '@primer/react/experimental';
import { Box, Text, IconButton, Spinner } from '@primer/react';
import {
  CrossMarkIcon,
  JupyterIcon,
  NotebookIcon,
} from '@datalayer/icons-react';
import { ServiceManager } from '@jupyterlab/services';
import { JSONExt } from '@lumino/coreutils';
import { IModel } from '@jupyterlab/services/lib/kernel/kernel';
import { useJupyter } from '../../jupyter/JupyterContext';

type KerneSpecInfos = {
  description: string;
  notebookExampleUrl: string;
};

export const Kernels = () => {
  const { serviceManager } = useJupyter();
  const [kernels, setKernels] = useState<IModel[]>();
  const [kernelSpecInfos, setKernelSpecInfos] = useState(
    new Map<string, KerneSpecInfos>()
  );
  const refreshKernels = (serviceManager: ServiceManager.IManager) => {
    setKernels(Array.from(serviceManager.kernels.running()));
  };
  useEffect(() => {
    serviceManager?.kernels.refreshRunning().then(() => {
      const kernels = Array.from(serviceManager.kernels.running());
      setKernels(kernels);
    });
    serviceManager?.kernelspecs.refreshSpecs().then(() => {
      const kernelSpecs = Object.values(
        serviceManager.kernelspecs.specs!.kernelspecs!
      );
      // Look for new kernel specifications
      const newSpecs = new Map<string, KerneSpecInfos>();
      kernelSpecs.forEach(kernelSpec => {
        const kernelSpecName = kernelSpec?.name;
        if (kernelSpecName?.startsWith('run-')) {
          const metadata = kernelSpec?.metadata;
          if (metadata) {
            const oldInfo = kernelSpecInfos.get(kernelSpecName);
            const newInfo = {
              description: metadata['description'] as string,
              notebookExampleUrl: metadata['notebook_example_url'] as string,
            };
            if (!JSONExt.deepEqual(oldInfo ?? {}, newInfo)) {
              newSpecs.set(kernelSpecName, newInfo);
            }
          }
        }
      });
      const newSpecInfos = new Map([...kernelSpecInfos, ...newSpecs]);
      if (newSpecs.size) {
        setKernelSpecInfos(newSpecInfos);
      }
    });
  }, [serviceManager]);
  const deleteKernel = (
    serviceManager: ServiceManager.IManager,
    kernelId: string
  ) => {
    serviceManager.kernels.shutdown(kernelId).then(() => {
      console.log(`Kernel ${kernelId} is terminated.`);
      refreshKernels(serviceManager);
    });
  };
  return (
    <Box mt={3} style={{ width: '1000px' }}>
      {kernels ? (
        <Table.Container>
          <Table.Title as="h2" id="images">
            Kernels
          </Table.Title>
          <Table.Subtitle as="p" id="images-subtitle">
            Available kernels.
          </Table.Subtitle>
          <DataTable
            aria-labelledby="running-kernels"
            aria-describedby="running-kernels-subtitle"
            data={kernels}
            columns={[
              {
                header: 'Name',
                field: 'name',
                renderCell: row => <Text>{row.name}</Text>,
              },
              {
                header: 'Description',
                id: 'description',
                renderCell: row => (
                  <Text>{kernelSpecInfos.get(row.name)?.description}</Text>
                ),
              },
              {
                header: 'State',
                field: 'execution_state',
                renderCell: row => <Text>{row.execution_state}</Text>,
              },
              {
                header: 'Example',
                id: 'example-action',
                renderCell: row => (
                  <>
                    {
                      <IconButton
                        aria-label={`Create an example notebook for kernel ${row.name}`}
                        icon={NotebookIcon}
                        size="small"
                        onClick={() => {}}
                      />
                    }
                  </>
                ),
              },
              {
                header: 'Delete',
                id: 'delete-action',
                renderCell: row => (
                  <>
                    {
                      <IconButton
                        aria-label={`Delete the kernel ${row.name}`}
                        icon={CrossMarkIcon}
                        size="small"
                        onClick={() => {
                          deleteKernel(serviceManager!, row.id);
                        }}
                      />
                    }
                  </>
                ),
              },
            ]}
          />
        </Table.Container>
      ) : (
        <Blankslate border>
          <Blankslate.Visual>
            <JupyterIcon size="medium" />
          </Blankslate.Visual>
          <Blankslate.Heading>Kernels</Blankslate.Heading>
          <Blankslate.Description>
            <Box sx={{ textAlign: 'center' }}>
              <Box>
                <Spinner />
              </Box>
              <Box>No kernel found so far...</Box>
            </Box>
          </Blankslate.Description>
        </Blankslate>
      )}
    </Box>
  );
};

export default Kernels;
