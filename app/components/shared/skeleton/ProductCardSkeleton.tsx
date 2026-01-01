"use client";

import styles from "./ProductCardSkeleton.module.css";

export default function ProductCardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.image}></div>
      <div className={styles.content}>
        <div className={styles.title}></div>
        <div className={styles.price}></div>
        <div className={styles.button}></div>
      </div>
    </div>
  );
}

