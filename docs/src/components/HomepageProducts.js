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
    title: 'React.js Components',
    Svg: ReactJsSvg,
    description: (
      <>
        <strong>@datalayer/jupyter-react</strong> provides Notebook, Cell, Terminal,
        Console, Output, and File Browser components to build custom Jupyter UIs
        with React.js.
      </>
    ),
  },
  {
    title: 'Lexical Editor',
    Svg: MemoSvg,
    description: (
      <>
        <strong>@datalayer/jupyter-lexical</strong> combines the{' '}
        <a href="https://lexical.dev" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
          Lexical
        </a>{' '}
        rich text editor with executable Jupyter cells for literate programming.
      </>
    ),
  },
  {
    title: 'Easy Embedding',
    Svg: RocketSvg,
    description: (
      <>
        <strong>@datalayer/jupyter-embed</strong> lets you add executable Python
        to any website using simple HTML data attributes - no React knowledge required.
      </>
    ),
  },
  {
    title: '100% Jupyter Compatible',
    Svg: JupyterSvg,
    description: (
      <>
        Built on top of JupyterLab internals. Connects to standard Jupyter servers
        and supports kernels, IPyWidgets, and the full Jupyter ecosystem.
      </>
    ),
  },
  {
    title: 'Interactive Storybook',
    Svg: BricksSvg,
    description: (
      <>
        Explore all components in our{' '}
        <a
          href="https://jupyter-ui-storybook.datalayer.tech"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'underline' }}
        >
          Storybook
        </a>{' '}
        with live examples and documentation.
      </>
    ),
  },
  {
    title: 'Open Source',
    Svg: OpenSourceSvg,
    description: (
      <>
        MIT licensed and built on renowned open source libraries. View the code on{' '}
        <a
          href="https://github.com/datalayer/jupyter-ui"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'underline' }}
        >
          GitHub
        </a>.
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
