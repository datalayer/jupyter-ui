import { useState } from "react";
import { ActionList, TextInput } from "@primer/react";
import { CheckIcon } from "@primer/octicons-react";
import { Cell, ICellModel } from "@jupyterlab/cells";
import NbGraderType, { getNbGraderType } from './NbGraderCells';

type Props = {
  notebookId: string;
  cell: Cell<ICellModel>;
  nbgrader: boolean;
};

export const CellMetadataEditor = (props: Props) => {
  const { cell } = props;
  const [cellGradeType, setCellGradeType] = useState(getNbGraderType(cell));
  const [nbg, setNbg] = useState(cell.model.getMetadata('nbgrader') || { grade_id: '', points: 0 });
  const handleGradeIdChange = (cell: Cell<ICellModel>, gradeId: string) => {
    const nbgrader = cell.model.getMetadata("nbgrader") as any;
    cell.model.setMetadata("nbgrader", {
      ...nbgrader,
      grade_id: gradeId,
    });
    setNbg({
      ...nbg,
      grade_id: gradeId,
    });
  }
  const handlePointsChange = (cell: Cell<ICellModel>, points: string) => {
    var points_number: number = +points;
    if (!isNaN(points_number)) {
      const nbgrader = cell.model.getMetadata("nbgrader") as any;
      cell.model.setMetadata("nbgrader", {
        ...nbgrader,
        points: points_number,
      });
      setNbg({
        ...nbg,
        points: points_number,
      });
    }
  }
  const assignCellGradeType = (cell: Cell<ICellModel>, cellGradeType: NbGraderType) => {
    switch (cellGradeType) {
      case NbGraderType.NotGraded: {
        cell.model.deleteMetadata("nbgrader")
        setCellGradeType(NbGraderType.NotGraded);
        break;
      }
      case NbGraderType.AutogradedAnswer: {
        const nbgrader = cell.model.getMetadata("nbgrader") as any;
        cell.model.setMetadata("nbgrader", {
          ...nbgrader,
          "grade": false,
          "solution": true,
          "locked": false,
          "task": false,
        });
        setCellGradeType(NbGraderType.AutogradedAnswer);
        break;
      }
      case NbGraderType.AutogradedTest: {
        const nbgrader = cell.model.getMetadata("nbgrader") as any;
        cell.model.setMetadata("nbgrader", {
          ...nbgrader,
          "grade": true,
          "solution": false,
          "locked": false,
          "task": false,
        });
        setCellGradeType(NbGraderType.AutogradedTest);
        break;
      }
      case NbGraderType.ManuallyGradedAnswer: {
        const nbgrader = cell.model.getMetadata("nbgrader") as any;
        cell.model.setMetadata("nbgrader", {
          ...nbgrader,
          "grade": true,
          "solution": true,
          "locked": false,
          "task": false,
        });
        setCellGradeType(NbGraderType.ManuallyGradedAnswer);
        break;
      }
      case NbGraderType.ManuallyGradedTask: {
        const nbgrader = cell.model.getMetadata("nbgrader") as any;
        cell.model.setMetadata("nbgrader", {
          ...nbgrader,
  //        "points": 1,
          "grade": false,
          "solution": false,
          "locked": true,
          "task": true,
        });
        setCellGradeType(NbGraderType.ManuallyGradedTask);
        break;
      }
      case NbGraderType.ReadonlyGraded: {
        const nbgrader = cell.model.getMetadata("nbgrader") as any;
        cell.model.setMetadata("nbgrader", {
          ...nbgrader,
          "grade": false,
          "solution": false,
          "locked": true,
          "task": false,
        });
        setCellGradeType(NbGraderType.ReadonlyGraded);
        break;
      }
    }
  }  
  return (
    <ActionList showDividers>
      <ActionList.Divider />
      <ActionList.Group title="NbGrader Cell Type" variant="subtle">
        <ActionList.Item onSelect={e => assignCellGradeType(cell, NbGraderType.NotGraded)}>
          { cellGradeType === NbGraderType.NotGraded &&
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          }
          None
          <ActionList.Description variant="block">
            Not a grader cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item onSelect={e => assignCellGradeType(cell, NbGraderType.AutogradedAnswer)}>
          { cellGradeType === NbGraderType.AutogradedAnswer &&
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          }
          Autograded answer
          <ActionList.Description variant="block">
            An autograded answer cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item role="listitem" onClick={e => assignCellGradeType(cell, NbGraderType.AutogradedTest)}>
          { cellGradeType === NbGraderType.AutogradedTest &&
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          }
          Autograded test
          <ActionList.Description variant="block">
            An autograded test cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item onSelect={e => assignCellGradeType(cell, NbGraderType.ManuallyGradedTask)}>
          { cellGradeType === NbGraderType.ManuallyGradedTask &&
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          }
          Manually graded task
          <ActionList.Description variant="block">
            A manually graded task cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item onSelect={e => assignCellGradeType(cell, NbGraderType.ManuallyGradedAnswer)}>
          { cellGradeType === NbGraderType.ManuallyGradedAnswer &&
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          }
          Manually graded answer
          <ActionList.Description variant="block">
            A manually graded answer cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item onSelect={e => assignCellGradeType(cell, NbGraderType.ReadonlyGraded)}>
          { cellGradeType === NbGraderType.ReadonlyGraded &&
            <ActionList.LeadingVisual>
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
        <ActionList.Group title="NbGrader Metadata" variant="subtle">
          <ActionList.Item onSelect={e => e.preventDefault()}>
            Grade ID: { <TextInput block value={nbg.grade_id} onChange={e => { e.preventDefault(); handleGradeIdChange(cell, e.target.value); }} /> }
          </ActionList.Item>
          <ActionList.Item>
            Points: { <TextInput block value={nbg.points} onChange={e => { e.preventDefault(); handlePointsChange(cell, e.target.value); }} /> }
          </ActionList.Item>
        </ActionList.Group>
      }
{/*
      <ActionList.Group title="NbGrader total points" variant="subtle">
        <ActionList.Item>
            Total points: 14
          </ActionList.Item>
      </ActionList.Group>
*/}
      </ActionList>
  )
}

export default CellMetadataEditor;
