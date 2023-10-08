import { makeObservable, observable, action } from "mobx";

export class AppState {
  tab: number;
  constructor(tab: number = 1) {
    makeObservable(this, {
      tab: observable,
      setTab: action,
    });
    this.tab = tab;
  }
  setTab(tab: number) {
    this.tab = tab;
  }
}

const appState = new AppState();

export default appState;
