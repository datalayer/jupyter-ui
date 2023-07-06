import React from 'react';

import * as style from './../style/index.css';
import * as j from './light.json';

export default class App extends React.Component<any, any> {
  public render() {
    console.log('--', style);
    console.log('--', j);
    return (
      <div>
        <h1 className={style.greenColor}>Hello from Typescript - This should be green</h1>
      </div>
    )
  }
}
