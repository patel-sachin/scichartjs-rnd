import { format } from "date-fns";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import { VisibleRangeChangedArgs } from "scichart/Charting/Visuals/Axis/VisibleRangeChangedArgs";

export function xAxisLabelFormatter(dataValue: number): string {
  const time = format(dataValue, "HH:mm:ss");
  return time;
}

export function yAxisLabelFormatter(dataValue: number): string {
  return dataValue.toFixed(4);
}

export const synchronizeAxis = (
  firstAxis: NumericAxis,
  secondAxis: NumericAxis
) => {
  firstAxis.visibleRangeChanged.subscribe(
    (data?: VisibleRangeChangedArgs | undefined) => {
      if (data?.visibleRange) {
        secondAxis.visibleRange = data.visibleRange;
      }
    }
  );

  secondAxis.visibleRangeChanged.subscribe(
    (data?: VisibleRangeChangedArgs | undefined) => {
      if (data?.visibleRange) {
        firstAxis.visibleRange = data.visibleRange;
      }
    }
  );
};
