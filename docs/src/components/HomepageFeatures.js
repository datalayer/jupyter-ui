import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Easy to use',
//    Svg: require('../../static/img/feature_1.svg').default,
    description: (
      <>
        Juyter React is designed from the ground up to be easily installed, used and extended
        to get your custom data analysis up and running quickly.
      </>
    ),
  },
  {
    title: 'Open source',
//    Svg: require('../../static/img/feature_3.svg').default,
    description: (
      <>
        Jupyter UI is built on top of renowed open source libraries and is also fully opensource.
      </>
    ),
  },
  {
    title: 'Professional support',
//    Svg: require('../../static/img/feature_2.svg').default,
    description: (
      <>
        Jupyter UI lets you focus on your work, and we&apos;ll do the chores.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
{/*
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
*/}
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
