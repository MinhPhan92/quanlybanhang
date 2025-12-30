"use client";

import { ReactNode } from "react";
import styles from "../dashboard.module.css";

export function StatCard({
  icon,
  iconBg,
  label,
  value,
  subValue,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <h3 className={styles.statLabel}>{label}</h3>
        <p className={styles.statValue}>{value}</p>
        {subValue ? <p className={styles.statSubValue}>{subValue}</p> : null}
      </div>
    </div>
  );
}


