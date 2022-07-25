import { useTypedSelector } from "./useTypedSelector";

export const useCumulativeCode = (cellId: string) => {
  return useTypedSelector(state => {
    const { data, order } = state.cells;
    const orderedCells = order.map(id => data[id]);
    const showFunc = `
    import _React from 'react';
    import _ReactDOM from 'react-dom';

    var show = (value) => {
      const root = document.querySelector('#root');

      if (typeof value === 'object') {
        // jsx
        if (value.$$typeof && value.props) {
          _ReactDOM.render(value, root);
        } else {
          root.innerHTML = JSON.stringify(value); 
        }
      } else {
        root.innerHTML = value; 
      }
    };
    `;
    const showFuncNoop = "var show = () => {}";

    const cumulativeCode = [];
    for (let orderedCell of orderedCells) {
      if (orderedCell.type === "code") {
        if (orderedCell.id === cellId) cumulativeCode.push(showFunc);
        else cumulativeCode.push(showFuncNoop);

        cumulativeCode.push(orderedCell.content);
      }
      if (orderedCell.id === cellId) break;
    }
    return cumulativeCode;
  });
};
