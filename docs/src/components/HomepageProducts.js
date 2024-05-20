/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import clsx from 'clsx';
import styles from './HomepageProducts.module.css';

const ProductList = [
  {
    title: 'React.js components',
    Svg: require('../../static/img/react-js.svg').default,
    description: (
      <>
        A variety of React.js components from Notebook, Cell, Output and Terminal allow you to get the best of Jupyter, with authentication and authorization.
      </>
    ),
  },
  {
    title: '100% compatible with Jupyter',
    Svg: require('../../static/img/jupyter.svg').default,
    description: (
      <>
        If you need more batteries for Jupyter, have a look to our <a href="./docs/category/components" style={{ textDecoration: "underline" }}>Jupyter components</a>.
      </>
    ),
  },
  {
    title: 'Components with a Storybook',
    Svg: require('../../static/img/bricks.svg').default,
    description: (
      <>
        You build your custom Data Product with well crafted Datalayer UI components. Have a look at the <a href="https://jupyter-ui-storybook.datalayer.tech" target="_blank" style={{ textDecoration: "underline" }}>Storybook</a>.
      </>
    ),
  },
  {
    title: 'Literate Notebook',
    Svg: require('../../static/img/memo.svg').default,
    description: (
      <>
        For a truly collaborative and accessible notebook, Literate Notebook is a better single-page editor for your data analysis.
      </>
    ),
  },
  {
    title: 'Easy to use',
    Svg: require('../../static/img/rocket.svg').default,
    description: (
      <>
        Juyter UI is designed from the ground up to be easily installed, used and extended
        to get your custom data analysis up and running quickly.
      </>
    ),
  },
  {
    title: 'Open source',
    Svg: require('../../static/img/open-source.svg').default,
    description: (
      <>
        Jupyter UI is built on top of renowed open source libraries and is also fully opensource.
      </>
    ),
  },
];

function Product({Svg, title, description}) {
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
