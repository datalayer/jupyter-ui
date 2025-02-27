/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ICellModel } from '@jupyterlab/cells';
import { CheckIcon } from '@primer/octicons-react';
import { ActionList, TextInput } from '@primer/react';
import { useCallback, useEffect, useState } from 'react';
import { newUlid } from '../../../../utils';
import NbGraderType, { getNbGraderType } from './NbGraderCells';

/**
 * Cell metadata editor properties
 */
export type ICellMetadataEditorProps = {
  /**
   * Cell model
   */
  cellModel: ICellModel;
};

/**
 * Cell metadata editor component
 */
export function CellMetadataEditor(
  props: ICellMetadataEditorProps
): JSX.Element {
  const { cellModel } = props;
  const [cellGradeType, setCellGradeType] = useState(
    getNbGraderType(cellModel)
  );
  const [nbGrade, setNbGrade] = useState<{ grade_id: string; points: number }>(
    cellModel.getMetadata('nbgrader') ?? { grade_id: newUlid(), points: 1 }
  );
  useEffect(() => {
    setNbGrade({
      grade_id: nbGrade.grade_id ?? newUlid(),
      points: nbGrade.points ?? 1,
    });
  }, [nbGrade]);
  const handleGradeIdChange = useCallback(
    (cellModel: ICellModel, gradeId: string) => {
      const nbgrader = cellModel.getMetadata('nbgrader') as any;
      cellModel.setMetadata('nbgrader', {
        ...nbgrader,
        grade_id: gradeId,
      });
      setNbGrade({
        ...nbGrade,
        grade_id: gradeId,
      });
    },
    []
  );
  const handlePointsChange = useCallback(
    (cellModel: ICellModel, points: string) => {
      const points_number: number = +points;
      if (!isNaN(points_number)) {
        const nbgrader = cellModel.getMetadata('nbgrader') as any;
        cellModel.setMetadata('nbgrader', {
          ...nbgrader,
          points: points_number,
        });
        setNbGrade({
          ...nbGrade,
          points: points_number,
        });
      }
    },
    []
  );
  const assignCellGradeType = useCallback(
    (cellModel: ICellModel, cellGradeType: NbGraderType) => {
      switch (cellGradeType) {
        case NbGraderType.NotGraded: {
          cellModel.deleteMetadata('nbgrader');
          setCellGradeType(NbGraderType.NotGraded);
          break;
        }
        case NbGraderType.AutogradedAnswer: {
          const nbgrader = cellModel.getMetadata('nbgrader') as any;
          cellModel.setMetadata('nbgrader', {
            ...nbgrader,
            grade: false,
            solution: true,
            locked: false,
            task: false,
            grade_id: newUlid(),
            points: 1,
          });
          setCellGradeType(NbGraderType.AutogradedAnswer);
          break;
        }
        case NbGraderType.AutogradedTest: {
          const nbgrader = cellModel.getMetadata('nbgrader') as any;
          cellModel.setMetadata('nbgrader', {
            ...nbgrader,
            grade: true,
            solution: false,
            locked: false,
            task: false,
            grade_id: newUlid(),
            points: 1,
          });
          setCellGradeType(NbGraderType.AutogradedTest);
          break;
        }
        case NbGraderType.ManuallyGradedAnswer: {
          const nbgrader = cellModel.getMetadata('nbgrader') as any;
          cellModel.setMetadata('nbgrader', {
            ...nbgrader,
            grade: true,
            solution: true,
            locked: false,
            task: false,
            grade_id: newUlid(),
            points: 1,
          });
          setCellGradeType(NbGraderType.ManuallyGradedAnswer);
          break;
        }
        case NbGraderType.ManuallyGradedTask: {
          const nbgrader = cellModel.getMetadata('nbgrader') as any;
          cellModel.setMetadata('nbgrader', {
            ...nbgrader,
            //        "points": 1,
            grade: false,
            solution: false,
            locked: true,
            task: true,
            grade_id: newUlid(),
            points: 1,
          });
          setCellGradeType(NbGraderType.ManuallyGradedTask);
          break;
        }
        case NbGraderType.ReadonlyGraded: {
          const nbgrader = cellModel.getMetadata('nbgrader') as any;
          cellModel.setMetadata('nbgrader', {
            ...nbgrader,
            grade: false,
            solution: false,
            locked: true,
            task: false,
          });
          setCellGradeType(NbGraderType.ReadonlyGraded);
          break;
        }
      }
    },
    []
  );
  return (
    <ActionList showDividers>
      <ActionList.Divider />
      <ActionList.Group title="NbGrader Cell Type" variant="subtle">
        <ActionList.Item
          onSelect={e => assignCellGradeType(cellModel, NbGraderType.NotGraded)}
        >
          {cellGradeType === NbGraderType.NotGraded && (
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          )}
          None
          <ActionList.Description variant="block">
            Not a grader cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item
          onSelect={e =>
            assignCellGradeType(cellModel, NbGraderType.AutogradedAnswer)
          }
        >
          {cellGradeType === NbGraderType.AutogradedAnswer && (
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          )}
          Autograded answer
          <ActionList.Description variant="block">
            An autograded answer cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item
          role="listitem"
          onClick={e =>
            assignCellGradeType(cellModel, NbGraderType.AutogradedTest)
          }
        >
          {cellGradeType === NbGraderType.AutogradedTest && (
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          )}
          Autograded test
          <ActionList.Description variant="block">
            An autograded test cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item
          onSelect={e =>
            assignCellGradeType(cellModel, NbGraderType.ManuallyGradedTask)
          }
        >
          {cellGradeType === NbGraderType.ManuallyGradedTask && (
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          )}
          Manually graded task
          <ActionList.Description variant="block">
            A manually graded task cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item
          onSelect={e =>
            assignCellGradeType(cellModel, NbGraderType.ManuallyGradedAnswer)
          }
        >
          {cellGradeType === NbGraderType.ManuallyGradedAnswer && (
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          )}
          Manually graded answer
          <ActionList.Description variant="block">
            A manually graded answer cell.
          </ActionList.Description>
        </ActionList.Item>
        <ActionList.Item
          onSelect={e =>
            assignCellGradeType(cellModel, NbGraderType.ReadonlyGraded)
          }
        >
          {cellGradeType === NbGraderType.ReadonlyGraded && (
            <ActionList.LeadingVisual>
              <CheckIcon />
            </ActionList.LeadingVisual>
          )}
          Readonly
          <ActionList.Description variant="block">
            A readonly grader cell.
          </ActionList.Description>
        </ActionList.Item>
      </ActionList.Group>
      {cellGradeType !== NbGraderType.NotGraded && (
        <ActionList.Group title="NbGrader Metadata" variant="subtle">
          <ActionList.Item onSelect={e => e.preventDefault()}>
            Grade ID:{' '}
            {
              <TextInput
                block
                value={nbGrade.grade_id}
                onChange={e => {
                  e.preventDefault();
                  handleGradeIdChange(cellModel, e.target.value);
                }}
              />
            }
          </ActionList.Item>
          <ActionList.Item>
            Points:{' '}
            {
              <TextInput
                block
                value={nbGrade.points}
                onChange={e => {
                  e.preventDefault();
                  handlePointsChange(cellModel, e.target.value);
                }}
              />
            }
          </ActionList.Item>
        </ActionList.Group>
      )}
      {/*
      <ActionList.Group title="NbGrader total points" variant="subtle">
        <ActionList.Item>
            Total points: 14
          </ActionList.Item>
      </ActionList.Group>
*/}
    </ActionList>
  );
}

export default CellMetadataEditor;
