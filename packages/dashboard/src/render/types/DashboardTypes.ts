export type IDashboardLayoutVariant = 'blank' | 'simple' | 'article' | undefined;

export type IDashboadConfig = {
  layoutVariant: IDashboardLayoutVariant;
  notebookUrl?: string;
}

export type IDashboardCell = {
  cellId: string;
  pos: {
    left: number;
    top: number;
    width: number;
    height: number;
  }
}

export type IDashboardLayout = {
  version: number;
  metadata: {
    dashboardHeight: number;
    dashboardWidth: number;
  }
  outputs: Map<string, IDashboardCell>;
  paths: Map<string, string>;
}
