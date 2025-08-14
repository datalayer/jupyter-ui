/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import clsx from 'clsx';
import styles from './HomepageProducts.module.css';
import ReactJsSvg from '../../static/img/react-js.svg';
import JupyterSvg from '../../static/img/jupyter.svg';
import BricksSvg from '../../static/img/bricks.svg';
import MemoSvg from '../../static/img/memo.svg';
import RocketSvg from '../../static/img/rocket.svg';
import OpenSourceSvg from '../../static/img/open-source.svg';

const ProductList = [
  {
    title: 'React.js components',
    Svg: ReactJsSvg,
    description: (
      <>
        A variety of React.js components from Notebook, Cell, Output and
        Terminal allow you to get the best of Jupyter, with authentication and
        authorization.
      </>
    ),
  },
  {
    title: '100% compatible with Jupyter',
    Svg: JupyterSvg,
    description: (
      <>
        If you need more batteries for Jupyter, have a look to our{' '}
        <a
          href="./docs/category/components"
          style={{ textDecoration: 'underline' }}
        >
          Jupyter components
        </a>
        .
      </>
    ),
  },
  {
    title: 'Components with a Storybook',
    Svg: BricksSvg,
    description: (
      <>
        You build your custom Data Product with well crafted Datalayer UI
        components. Have a look at the{' '}
        <a
          href="https://jupyter-ui-storybook.datalayer.tech"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'underline' }}
        >
          Storybook
        </a>
        .
      </>
    ),
  },
  {
    title: 'Literate Notebook',
    Svg: MemoSvg,
    description: (
      <>
        For a truly collaborative and accessible notebook, Literate Notebook is
        a better single-page editor for your data analysis.
      </>
    ),
  },
  {
    title: 'Easy to use',
    Svg: RocketSvg,
    description: (
      <>
        Juyter UI is designed from the ground up to be easily installed, used
        and extended to get your custom data analysis up and running quickly.
      </>
    ),
  },
  {
    title: 'Open source',
    Svg: OpenSourceSvg,
    description: (
      <>
        Jupyter UI is built on top of renowed open source libraries and is also
        fully opensource.
      </>
    ),
  },
];

function Product({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.productSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageProducts() {
  return (
    <section className={styles.Products}>
      <div className="container">
        <div className="row">
          {ProductList.map((props, idx) => (
            <Product key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
