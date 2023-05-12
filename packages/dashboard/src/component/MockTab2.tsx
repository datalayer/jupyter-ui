import { StyledOcticon } from "@primer/react";
import { TreeView } from "@primer/react/drafts";
import { FileIcon, DiffAddedIcon, DiffModifiedIcon } from '@primer/octicons-react';

const MockTab2 = (): JSX.Element => {
  return (
    <>
      <TreeView>
      <TreeView.Item id="" defaultExpanded>
        <TreeView.LeadingVisual>
          <TreeView.DirectoryIcon />
        </TreeView.LeadingVisual>
        Notebooks
        <TreeView.SubTree>
          <TreeView.Item id="src/Avatar.tsx">
            <TreeView.LeadingVisual>
              <FileIcon />
            </TreeView.LeadingVisual>
            Deep learing
            <TreeView.TrailingVisual>
              <StyledOcticon icon={DiffAddedIcon} color="success.fg" aria-label="added" />
            </TreeView.TrailingVisual>
          </TreeView.Item>
          <TreeView.Item id="" current>
            <TreeView.LeadingVisual>
              <FileIcon />
            </TreeView.LeadingVisual>
            AI for fun
            <TreeView.TrailingVisual>
              <StyledOcticon icon={DiffModifiedIcon} color="attention.fg" aria-label="modified" />
            </TreeView.TrailingVisual>
          </TreeView.Item>
        </TreeView.SubTree>
      </TreeView.Item>
      <TreeView.Item id="">
        <TreeView.LeadingVisual>
          <FileIcon />
        </TreeView.LeadingVisual>
        README.mdx
        <TreeView.TrailingVisual>
          <StyledOcticon icon={DiffModifiedIcon} color="attention.fg" aria-label="modified" />
        </TreeView.TrailingVisual>
      </TreeView.Item>
    </TreeView>
  </>
  );
};

export default MockTab2;
