import React from 'react';
import clsx from 'clsx';
import styles from './HomepageProducts.module.css';

const ProductList = [
  /*
  {
    title: 'Clouder',
    Svg: require('../../static/img/product_1.svg').default,
    description: (
      <>
        Get started by creating a Jupyter platform in the cloud with <a href="./docs/run/clouder/index">Clouder</a>. You will get Jupyter on Kubernetes with a cloud database and storage bucket to persist your notebooks and datasets.
      </>
    ),
  },
  {
    title: 'Jupyter',
    Svg: require('../../static/img/product_2.svg').default,
    description: (
      <>
        If you need more batteries for Jupyter, have a look to our <a href="./docs/tech/editor/index">Jupyter components</a>. The components allow you to get the best of Jupyter notebooks, with features like authentication, authorization, React.js user interface, server and kernel instant start, administration...
      </>
    ),
  },
  {
    title: 'Sharebook',
    Svg: require('../../static/img/product_3.svg').default,
    description: (
      <>
        For a truly collaborative and accessible notebook, try <a href="./docs/editor/index">Sharebook</a>, a better better literate notebook, with built-in collaboration, accessibility...
      </>
    ),
  },
  */
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
