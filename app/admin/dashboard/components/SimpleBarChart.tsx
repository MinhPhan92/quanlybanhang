"use client";

import styles from "../dashboard.module.css";

export type SimpleBarChartPoint = {
  label: string;
  value: number;
  tooltip?: string;
};

export function SimpleBarChart({
  data,
  formatValue,
}: {
  data: SimpleBarChartPoint[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value || 0), 1);

  return (
    <div className={styles.chartContainer}>
      {data.map((d, index) => {
        const heightPct = Math.max((d.value / max) * 100, 5);
        return (
          <div key={index} className={styles.chartBar} title={d.tooltip || ""}>
            <div
              className={styles.chartBarFill}
              style={{ height: `${heightPct}%` }}
            />
            <div className={styles.chartBarLabel}>
              <span>{d.label}</span>
              <span className={styles.chartBarValue}>
                {formatValue ? formatValue(d.value) : String(d.value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


