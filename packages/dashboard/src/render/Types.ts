export type ILayoutVariant = 'blank' | 'simple' | 'article' | undefined;

export type IConfig = {
  layoutVariant: ILayoutVariant;
  notebookUrl?: string;
}

export type IDashCell = {
  cellId: string,
  pos: {
    left: number,
    top: number,
    width: number,
    height: number,
  }
}

export type ILayout = {
  version: number,
  metadata: {
    dashboardHeight: number,
    dashboardWidth: number,
  }
  outputs: Map<string, IDashCell>,
  paths: Map<string, string>,
}
