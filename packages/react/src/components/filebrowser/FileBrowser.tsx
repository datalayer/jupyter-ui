/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect, useReducer } from 'react';
import { TreeView } from '@primer/react';
import { FileIcon } from '@primer/octicons-react';
import { ServiceManager } from '@jupyterlab/services';
import JupyterServices from './../../jupyter/services/JupyterServices';

interface RenderTree {
  id: string;
  name: string;
  children?: readonly RenderTree[];
}

const initialTree: RenderTree = {
  id: 'root',
  name: 'File Browser',
};

export type FileBrowserProps = {
  serviceManager: ServiceManager.IManager;
};

export const FileBrowser = (props: FileBrowserProps) => {
  const { serviceManager } = props;
  const [tree, setTree] = useState(initialTree);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const loadPath = (
    services: JupyterServices,
    subTree: RenderTree,
    path: string[]
  ) => {
    const loadFolderItems = (
      services: JupyterServices,
      path: string[]
    ): Promise<RenderTree[]> => {
      const folderItems = services
        .contents()
        .get(path.join('/'))
        .then(res => {
          const items = res.content.map((e: any) => {
            if (e.type === 'directory') {
              return {
                id: 'folder_' + e.name,
                name: e.name,
                children: new Array<RenderTree>(),
              };
            } else {
              return {
                id: 'file_' + e.name,
                name: e.name,
              };
            }
          });
          const renderTree = items as RenderTree[];
          renderTree.sort((a, b) => {
            if (a.id.startsWith('folder_') && b.id.startsWith('file_')) {
              return -1;
            }
            if (a.id.startsWith('file_') && b.id.startsWith('folder_')) {
              return 1;
            }
            return a.name.localeCompare(b.name);
          });
          return renderTree;
        });
      return folderItems;
    };
    loadFolderItems(services, path).then(folderItems => {
      subTree.children = folderItems;
      for (const child of subTree.children) {
        if (child.id.startsWith('folder_')) {
          loadPath(services, child, path.concat(child.name));
        }
      }
      setTree(initialTree);
      forceUpdate();
    });
  };
  useEffect(() => {
    if (serviceManager) {
      const services = new JupyterServices(serviceManager);
      loadPath(services, initialTree, []);
    }
  }, [serviceManager]);
  const renderTree = (nodes: RenderTree[]) => {
    return nodes.map((node: RenderTree) => (
      <TreeView.Item key={node.id} id={node.id}>
        <TreeView.LeadingVisual>
          {Array.isArray(node.children) ? (
            <TreeView.DirectoryIcon />
          ) : (
            <FileIcon />
          )}
        </TreeView.LeadingVisual>
        {node.name}
        {Array.isArray(node.children) && (
          <TreeView.SubTree>{renderTree(node.children)}</TreeView.SubTree>
        )}
      </TreeView.Item>
    ));
  };
  return (
    <>
      <TreeView>
        <TreeView.Item id={tree.id} defaultExpanded>
          <TreeView.LeadingVisual>
            <TreeView.DirectoryIcon />
          </TreeView.LeadingVisual>
          {tree.name}
          {Array.isArray(tree.children) && (
            <TreeView.SubTree>{renderTree(tree.children)}</TreeView.SubTree>
          )}
        </TreeView.Item>
      </TreeView>
    </>
  );
};

export default FileBrowser;
