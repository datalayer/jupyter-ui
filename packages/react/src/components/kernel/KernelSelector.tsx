/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import {
  ActionMenu,
  ActionList,
  IconButton,
} from '@primer/react';
import { JupyterKernelIcon, JupyterKernelGalileoIcon } from '@datalayer/icons-react';
import { IModel } from '@jupyterlab/services/lib/kernel/kernel';
import { ISpecModel } from '@jupyterlab/services/lib/kernelspec/kernelspec';
import { useJupyter } from '../../jupyter/JupyterContext';

type Props = {
  selectKernel: (kernelModel: IModel) => void;
  selectKernelSpec: (kernelSpecModel: ISpecModel) => void;
}

type KernelSpecs = {
  [key: string]: ISpecModel | undefined;
} | undefined

export const KernelSelector = (props: Props) => {
  const { selectKernel, selectKernelSpec } = props;
  const { serviceManager } = useJupyter();
  const [kernels, setKernels] = useState<IModel[]>();
  const [kernelSpecs, setKernelSpecs] = useState<KernelSpecs>();
  useEffect(() => {
    serviceManager?.ready.then(() => {
      serviceManager.kernelspecs.refreshSpecs().then(() => {
        const kernelSpecs = serviceManager.kernelspecs.specs?.kernelspecs;
        setKernelSpecs(kernelSpecs);
      });
      serviceManager.kernels.refreshRunning().then(() => {
        const kernels = Array.from(serviceManager.kernels.running());
        setKernels(kernels);
      });
    });
  }, [serviceManager]);
  return (
    <>
    <ActionMenu>
      <ActionMenu.Anchor>
        <IconButton
          aria-labelledby=""
          icon={JupyterKernelGalileoIcon}
          variant="invisible"
        />
      </ActionMenu.Anchor>
      <ActionMenu.Overlay width="large">
        <ActionList showDividers>
          { kernels && <ActionList.Group title="Connect to a running Kernel">
            { kernels.map(kernel => {
              return (
                <ActionList.Item
                  onSelect={e => {
                    selectKernel(kernel!)
                  }}
                >
                  <ActionList.LeadingVisual>
                    <JupyterKernelIcon />
                  </ActionList.LeadingVisual>
                  {kernel.name}
                  <ActionList.Description variant="block">
                    {kernel.id}
                  </ActionList.Description>
                </ActionList.Item>
              )})
            }
            </ActionList.Group>
          }
          <ActionList.Group title="Launch a new Kernel">
            { kernelSpecs && Object.values(kernelSpecs).map(specModel => {
              return (
                <ActionList.Item
                  onSelect={e => {
                    selectKernelSpec(specModel!)
                  }}
                >
                  <ActionList.LeadingVisual>
                    <JupyterKernelGalileoIcon />
                  </ActionList.LeadingVisual>
                  {specModel?.name}
                  <ActionList.Description variant="block">
                  {specModel?.display_name}
                  </ActionList.Description>
                </ActionList.Item>
              )})
            }
          </ActionList.Group>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  </>
  )
};

export default KernelSelector;
