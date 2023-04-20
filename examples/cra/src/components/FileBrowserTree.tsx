import { useState, useEffect, useReducer } from 'react';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import { useJupyter, Services } from '@datalayer/jupyter-react';

interface RenderTree {
  id: string;
  name: string;
  children?: readonly RenderTree[];
}

const initialTree: RenderTree = {
  id: 'root',
  name: 'Jupyter Content',
};

export const FileBrowserTree = () => {
  const [tree, setTree] = useState(initialTree);
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const { serviceManager } = useJupyter();
  const [services, _] = useState(new Services(serviceManager!));
  const loadPath = (subTree: RenderTree, path: string[]) => {
    const loadFolderItems = (path: string[]): Promise<RenderTree[]> => {
      const folderItems = services.contents().get(path.join('/')).then(res => {
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
            }
          }}
        );
        return items as RenderTree[];
      });
      return folderItems;
    };
    loadFolderItems(path).then(folderItems => {
      subTree.children = folderItems;
      for (const child of subTree.children) {
        if (child.id.startsWith('folder_')) {
          loadPath(child, path.concat(child.name));
        }
      }
      setTree(initialTree);
      forceUpdate();
    });
  }
  useEffect(() => {
    loadPath(initialTree, []);
  }, []);
  const renderTree = (nodes: RenderTree) => {
    return <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
      {Array.isArray(nodes.children)
        ? nodes.children.map(node => renderTree(node))
        : null}
    </TreeItem>
  };
  return (
    <>
      <TreeView
        aria-label="rich object"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpanded={['root']}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{height: 210, flexGrow: 1, maxWidth: 400, overflowY: 'auto'}}
      >
        {renderTree(tree)}
      </TreeView>
    </>
  );
};

export default FileBrowserTree;
