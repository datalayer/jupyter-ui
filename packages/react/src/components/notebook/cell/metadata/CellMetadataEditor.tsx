import { ActionList, TextInput } from "@primer/react";
import { CheckIcon } from "@primer/octicons-react";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { selectNotebook } from '../../NotebookState';
import NbGraderType, { getNbGraderType, setCellGradeType } from './NbGraderCells';

type Props = {
  notebookId: string;
  cell: Cell<ICellModel>;
  nbgrader: boolean;
};

const handleGradeIdChange = (cell: Cell<ICellModel>, gradeId: string) => {
  const nbgrader = cell.model.metadata.get("nbgrader") as any;
  cell.model.metadata.set("nbgrader", {
    ...nbgrader,
    grade_id: gradeId,
  });
}

const handlePointsChange = (cell: Cell<ICellModel>, points: string) => {
  var p: number = +points;
  if (!isNaN(p)) {
    const nbgrader = cell.model.metadata.get("nbgrader") as any;
    cell.model.metadata.set("nbgrader", {
      ...nbgrader,
      points: p,
    });
  }
}

export const CellMetadataEditor = (props: Props) => {
  const { notebookId, cell, nbgrader } = props;
  if (!cell || !cell.model) {
    return <></>
  }
  const cellGradeType = getNbGraderType(cell);
  // TODO Do not remove for now this selectNotebook, otherwise this component will not refresh.
  // TODO Better handle this case with a local state.
  selectNotebook(notebookId);
  const nbg = cell.model.metadata?.get('nbgrader') as any;
  return (
    <ActionList showDividers>
{/*
      <ActionList.Group title="Cell type">
        <ActionList.Item onSelect={e => dispatch(notebookActions.changeCellType.started("code"))}>
          { cell.model.type === 'code' && <ActionList.LeadingVisual>
            <CheckIcon />
          </ActionList.LeadingVisual>
          }
          Code
        </ActionList.Item>
        <ActionList.Item onSelect={e => dispatch(notebookActions.changeCellType.started("markdown"))}>
          { cell.model.type === 'markdown' &&<ActionList.LeadingVisual>
            <CheckIcon />
          </ActionList.LeadingVisual>
          }
          Markdown
        </ActionList.Item>
        <ActionList.Item onSelect={e => dispatch(notebookActions.changeCellType.started("raw"))}>
          { cell.model.type === 'raw' &&< ActionList.LeadingVisual>
            <CheckIcon />
          </ActionList.LeadingVisual>
          }
          Raw
        </ActionList.Item>
      </ActionList.Group>
*/}
      {nbgrader &&
        <>
          <ActionList.Divider />
          <ActionList.Group title="NbGrader cell type" variant="subtle">
            <ActionList.Item onSelect={e => setCellGradeType(cell, NbGraderType.NotGraded)}>
              { cellGradeType === NbGraderType.NotGraded && <ActionList.LeadingVisual>
                  <CheckIcon />
                </ActionList.LeadingVisual>
              }
              None
              <ActionList.Description variant="block">
                Not a grader cell.
              </ActionList.Description>
            </ActionList.Item>
            <ActionList.Item onSelect={e => setCellGradeType(cell, NbGraderType.AutogradedAnswer)}>
              { cellGradeType === NbGraderType.AutogradedAnswer && <ActionList.LeadingVisual>
                  <CheckIcon />
                </ActionList.LeadingVisual>
              }
              Autograded answer
              <ActionList.Description variant="block">
                An autograded answer cell.
              </ActionList.Description>
            </ActionList.Item>
            <ActionList.Item role="listitem" onClick={e => setCellGradeType(cell, NbGraderType.AutogradedTest)}>
              { cellGradeType === NbGraderType.AutogradedTest && <ActionList.LeadingVisual>
                  <CheckIcon />
                </ActionList.LeadingVisual>
              }
              Autograded test
              <ActionList.Description variant="block">
                An autograded test cell.
              </ActionList.Description>
            </ActionList.Item>
            <ActionList.Item onSelect={e => setCellGradeType(cell, NbGraderType.ManuallyGradedTask)}>
              { cellGradeType === NbGraderType.ManuallyGradedTask && <ActionList.LeadingVisual>
                  <CheckIcon />
                </ActionList.LeadingVisual>
              }
              Manually graded task
              <ActionList.Description variant="block">
                A manually graded task cell.
              </ActionList.Description>
            </ActionList.Item>
            <ActionList.Item onSelect={e => setCellGradeType(cell, NbGraderType.ManuallyGradedAnswer)}>
              { cellGradeType === NbGraderType.ManuallyGradedAnswer && <ActionList.LeadingVisual>
                  <CheckIcon />
                </ActionList.LeadingVisual>
              }
              Manually graded answer
              <ActionList.Description variant="block">
                A manually graded answer cell.
              </ActionList.Description>
            </ActionList.Item>
            <ActionList.Item onSelect={e => setCellGradeType(cell, NbGraderType.ReadonlyGraded)}>
              { cellGradeType === NbGraderType.ReadonlyGraded && <ActionList.LeadingVisual>
                  <CheckIcon />
                </ActionList.LeadingVisual>
              }
              Readonly
              <ActionList.Description variant="block">
                A readonly grader cell.
              </ActionList.Description>
            </ActionList.Item>
          </ActionList.Group>
          { cellGradeType !== NbGraderType.NotGraded &&
            <>
              <ActionList.Group title="NbGrader metadata" variant="subtle">
                <ActionList.Item>
                  Grade ID:
                  { nbg &&
                    <TextInput block value={nbg.grade_id} onChange={e => {e.preventDefault(); handleGradeIdChange(cell, e.target.value)}} />                    
                  }
                </ActionList.Item>
                <ActionList.Item>
                  Points:
                  { nbg &&
                    <TextInput block value={nbg.points} onChange={e => {e.preventDefault(); handlePointsChange(cell, e.target.value)}} />                    
                  }
                </ActionList.Item>
              </ActionList.Group>
            </>
          }
{/*
          <ActionList.Group title="NbGrader total points" variant="subtle">
            <ActionList.Item>
                Total points: 14
              </ActionList.Item>
          </ActionList.Group>
*/}
        </>
      }
      </ActionList>
  )
}

export default CellMetadataEditor;
