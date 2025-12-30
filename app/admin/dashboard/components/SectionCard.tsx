"use client";

import { ReactNode } from "react";
import styles from "../dashboard.module.css";

export function SectionCard({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {right ? <div className={styles.sectionRight}>{right}</div> : null}
      </div>
      {children}
    </div>
  );
}


