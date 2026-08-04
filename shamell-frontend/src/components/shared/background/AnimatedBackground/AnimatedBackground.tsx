"use client";

import styles from "./AnimatedBackground.module.css";

type AnimatedBackgroundProps = {
  forceAnimation?: boolean;
};

const PARTICLE_POSITIONS = [
  { top: 15, left: 20, delay: 0 },
  { top: 35, left: 80, delay: 1.2 },
  { top: 60, left: 15, delay: 2.4 },
  { top: 25, left: 65, delay: 0.6 },
  { top: 75, left: 50, delay: 3 },
  { top: 50, left: 90, delay: 1.8 },
  { top: 10, left: 50, delay: 2 },
  { top: 80, left: 25, delay: 0.9 },
];

export function AnimatedBackground({ forceAnimation = false }: AnimatedBackgroundProps) {
  return (
    <div className={styles.stage} data-force-motion={forceAnimation}>
      <div className={styles.orbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orbPurple}`} />
        <div className={`${styles.orb} ${styles.orbPurple2}`} />
        <div className={`${styles.orb} ${styles.orbRed}`} />
        <div className={`${styles.orb} ${styles.orbGold}`} />
        <div className={`${styles.orb} ${styles.orbGray}`} />
        {PARTICLE_POSITIONS.map((p, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
