/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';
import TargetSvg from '../../static/img/target.svg';

const FeatureList = [
  {
    title: 'Professional support',
    Svg: TargetSvg,
    description: (
      <>
        Jupyter UI lets you focus on your work, and we&apos;ll do the chores.
        Check the{' '}
        <a
          href="https://jupyter-ui.datalayer.tech/docs/support"
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'underline' }}
        >
          support options
        </a>
        .
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>

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
