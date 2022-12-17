import { Cell, ICellModel } from "@jupyterlab/cells";
/*
// Autograded answer (only for code cells) { grade: false, solution: true, locked: false  }
{
  "nbgrader": {
    "grade_id": "squares",
    "schema_version": 3,
    "grade": false,
    "solution": true,
    "locked": false
  }
}
// Autograded test (only for code cells) { grade: true, solution: false, locked: false, points: ... }
{
  "nbgrader": {
    "grade_id": "correct_squares",
    "schema_version": 3,
    "grade": true,
    "solution": false,
    "locked": false,
    "points": 1
  }
}
// Manually graded task { grade: false, solution: false, locked: true, task: true, points: ... }
{
  "nbgrader": {
    "grade_id": "part-a",
    "schema_version": 3,
    "grade": false,
    "solution": false,
    "locked": true,
    "task": true,
    "points": 0
  }
}
// Manually graded answer { grade: true, solution: true, locked: false, points: ... }
{
  "nbgrader": {
    "grade_id": "sum_of_squares_equation",
    "schema_version": 3,
    "grade": true,
    "solution": true,
    "locked": false,
    "points": 1
  }
}
// Readonly { grade: false, solution: false, solution: false, locked: true, task: false }
{
  "nbgrader": {
    "grade_id": "squares",
    "schema_version": 3,
    "grade": false,
    "solution": false,
    "locked": true,
    "task": false
  }
}
*/
export enum NbGraderType {
  NotGraded,
  AutogradedAnswer,
  AutogradedTest,
  ManuallyGradedTask,
  ManuallyGradedAnswer,
  ReadonlyGraded,
}

export const getNbGraderType = (cell: Cell<ICellModel>) => {
  const nbgrader = cell.model.getMetadata("nbgrader") as any;
  if (!nbgrader) {
    return NbGraderType.NotGraded;
  }
  const grade = nbgrader.grade;
  const solution = nbgrader.solution;
  const locked = nbgrader.locked;
  const task = nbgrader.task;
  // Autograded answer (only for code cells) { grade: false, solution: true, locked: false  }
  if (!grade && solution && !locked) {
    return NbGraderType.AutogradedAnswer;
  }
  // Autograded test (only for code cells) { grade: true, solution: false, locked: false, points: ... }
  if (grade && !solution && !locked) {
    return NbGraderType.AutogradedTest;
  }
  // Manually graded task { grade: false, solution: false, locked: true, task: true, points: ... }
  if (!grade && !solution && locked && task) {
    return NbGraderType.ManuallyGradedTask;
  }
  // Manually graded answer { grade: true, solution: true, locked: false, points: ... }
  if (grade && solution && !locked) {
    return NbGraderType.ManuallyGradedAnswer;
  }
  // Readonly { grade: false, solution: false, solution: false, locked: true, task: false }
  if (!grade && !solution && locked && !task) {
    return NbGraderType.ReadonlyGraded;
  }
  return NbGraderType.NotGraded;
}

export default NbGraderType;
