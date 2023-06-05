import { useState, useEffect, useReducer } from 'react';
import { TreeView } from '@primer/react';
import { FileIcon } from '@primer/octicons-react';
import { useJupyter } from './../../jupyter/JupyterContext';
import Services from './../../jupyter/services/Services';

interface RenderTree {
  id: string;
  name: string;
  children?: readonly RenderTree[];
}

const initialTree: RenderTree = {
  id: 'root',
  name: 'Jupyter Content',
};

export const FileBrowser = () => {
  const [tree, setTree] = useState(initialTree);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const { serviceManager } = useJupyter();
  const loadPath = (
    services: Services,
    subTree: RenderTree,
    path: string[]
  ) => {
    const loadFolderItems = (
      services: Services,
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
          return items as RenderTree[];
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
      const services = new Services(serviceManager!);
      loadPath(services, initialTree, []);
    }
  }, [serviceManager]);

  const renderTree = (nodes: RenderTree[]) => {
    return nodes.map((node: RenderTree) => (
      <TreeView.Item id={node.id}>
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
  }

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
}

export default FileBrowser;
