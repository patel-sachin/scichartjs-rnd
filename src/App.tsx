import "./styles.css";
import { useEffect, useRef, useState } from 'react';
import { SciChartSurface } from 'scichart/Charting/Visuals/SciChartSurface';
import { libraryVersion } from "scichart/Core/BuildStamp";
import { NumericAxis } from 'scichart/Charting/Visuals/Axis/NumericAxis';
import { XyDataSeries } from 'scichart/Charting/Model/XyDataSeries';
import { FastLineRenderableSeries } from 'scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries';
import { MouseWheelZoomModifier } from 'scichart/Charting/ChartModifiers/MouseWheelZoomModifier';
import { ZoomExtentsModifier } from 'scichart/Charting/ChartModifiers/ZoomExtentsModifier';
import { EExecuteOn } from 'scichart/types/ExecuteOn';
import { CursorModifier } from 'scichart/Charting/ChartModifiers/CursorModifier';
import { EAxisAlignment } from 'scichart/types/AxisAlignment';
import { SciChartVerticalGroup } from 'scichart/Charting/LayoutManager/SciChartVerticalGroup';
import { Thickness } from 'scichart/Core/Thickness';
import { UpdateSuspender } from 'scichart/Charting/Visuals/UpdateSuspender';
import { TSciChart } from 'scichart/types/TSciChart';
import { XAxisDragModifier } from 'scichart/Charting/ChartModifiers/XAxisDragModifier';
import { EDragMode } from 'scichart/types/DragMode';
import { YAxisDragModifier } from 'scichart/Charting/ChartModifiers/YAxisDragModifier';
import { ChartModifierBase2D } from 'scichart/Charting/ChartModifiers/ChartModifierBase2D';
import { LegendModifier } from 'scichart/Charting/ChartModifiers/LegendModifier';
import { RolloverModifier } from 'scichart/Charting/ChartModifiers/RolloverModifier';
import { ELegendOrientation, ELegendPlacement } from 'scichart/Charting/Visuals/Legend/SciChartLegendBase';
import { ELineDrawMode } from 'scichart/Charting/Drawing/WebGlRenderContext2D';
import { VisibleRangeChangedArgs } from 'scichart/Charting/Visuals/Axis/VisibleRangeChangedArgs';
import { addSeconds, format } from 'date-fns';
import { SeriesInfo } from 'scichart/Charting/Model/ChartData/SeriesInfo';
import { EAutoRange } from 'scichart/types/AutoRange';
import { DataPointSelectionPaletteProvider } from "scichart/Charting/Model/DataPointSelectionPaletteProvider";
import { TimeSeriesZoomPanModifier, TimeSeriesRubberBandXyZoomModifier, TimeSeriesDataPointSelectionModifier } from './customModifiers';

// Load Wasm & Data files from URL
// This URL can be anything, but for example purposes we are loading from JSDelivr CDN
SciChartSurface.configure({
   dataUrl: `https://cdn.jsdelivr.net/npm/scichart@${libraryVersion}/_wasm/scichart2d.data`,
   wasmUrl: `https://cdn.jsdelivr.net/npm/scichart@${libraryVersion}/_wasm/scichart2d.wasm`
});

                
export class RandomWalkGenerator {
  private readonly bias: number;
  private last: number = 0;
  private i: number = 0;
  constructor(bias: number = 0.01) {
      this.bias = bias;
      this.reset();
  }

  public reset() {
      this.i = 0;
      this.last = 3520;
  }

  public getRandomWalkSeries(count: number): number[] {
      const yValues: number[] = [];
      for (let i = 0; i < count; i++) {
          const next: number = this.last + (Math.random() - 0.5 + this.bias);
          yValues.push(next);
          this.last = next;
      }

      return yValues;
  }
}

type TXyValues = {
  x: number[];
  y: number[];
};

type TChartComponents = {
  chartSurface: SciChartSurface;
  wasmContext: TSciChart;
  xAxis: NumericAxis;
  yAxis: NumericAxis;
  dataSeries: XyDataSeries;
  lineSeries: FastLineRenderableSeries;
};

function xAxisLabelFormatter(dataValue: number): string {
  const time = format(dataValue, 'HH:mm:ss');
  return time;
}

function yAxisLabelFormatter(dataValue: number): string {
  return dataValue.toFixed(4);
}

const App = () => {
  const lineChart1Ref = useRef<TChartComponents>();
  const lineChart2Ref = useRef<TChartComponents>();
  const [titleSuffix, setTitleSuffix] = useState<string>("");

  useEffect(() => {
      async function initChartsAsync(): Promise<void> {
          const verticalGroup = new SciChartVerticalGroup();

          function buildSharedChartModifiers(): ChartModifierBase2D[] {
              return [
                  new MouseWheelZoomModifier(),
                  new ZoomExtentsModifier({
                      isAnimated: false 
                    }),
                  new LegendModifier({
                      showCheckboxes: true,
                      orientation: ELegendOrientation.Horizontal,
                      placement: ELegendPlacement.TopRight,
                  }),
                  new RolloverModifier({
                      modifierGroup: 'group1',
                      showRolloverLine: false,
                      snapToDataPoint: true,
                      tooltipDataTemplate: (seriesInfo: SeriesInfo, tooltipTitle: string): string[] => {
                          const valuesWithLabels = [];
                          valuesWithLabels.push(tooltipTitle);
                          valuesWithLabels.push('-----------------');
                          valuesWithLabels.push(`x: ${seriesInfo.formattedXValue}`);
                          valuesWithLabels.push(`y: ${seriesInfo.formattedYValue}`);
                          return valuesWithLabels;
                      },
                  }),
                  new CursorModifier({ modifierGroup: 'group1' }),
                  new XAxisDragModifier({
                      dragMode: EDragMode.Scaling 
                    }),
                  new YAxisDragModifier({
                      dragMode: EDragMode.Scaling 
                    }),
                  new TimeSeriesZoomPanModifier({
                      executeOn: EExecuteOn.MouseLeftButton 
                    }),
                  new TimeSeriesRubberBandXyZoomModifier({
                      isAnimated: false,
                      executeOn: EExecuteOn.MouseLeftButton,
                  }),
                  new TimeSeriesDataPointSelectionModifier({
                      executeOn: EExecuteOn.MouseLeftButton,
                      allowDragSelect: false,
                      onSelectionChanged: (args) => console.log('data-point selected', args),
                  }),
              ];
          }

          async function initLineChartAsync(
              containerDiv: string,
              seriesName: string,
              seriesColor: string
          ): Promise<[chartId: string, chartComponents: TChartComponents]> {
              const { sciChartSurface, wasmContext } = await SciChartSurface.create(containerDiv);
              sciChartSurface.padding = Thickness.fromNumber(5);
              sciChartSurface.background = 'black';

              const xAxis = new NumericAxis(wasmContext, {
                  drawMajorGridLines: true,
                  drawMajorTickLines: true,
                  drawMinorGridLines: true,
                  drawMinorTickLines: true,
                  drawMajorBands: false,
                  autoTicks: true,
                  maxAutoTicks: 100,
                  drawLabels: true,
                  axisAlignment: EAxisAlignment.Bottom,

                  isVisible: true,
              });

              const yAxis = new NumericAxis(wasmContext, {
                  drawMajorGridLines: true,
                  drawMajorTickLines: true,
                  drawMinorGridLines: true,
                  drawMinorTickLines: true,
                  drawMajorBands: false,
                  autoTicks: true,
                  maxAutoTicks: 20,
                  drawLabels: true,
                  axisAlignment: EAxisAlignment.Left,
              });

              xAxis.labelProvider.formatLabel = xAxisLabelFormatter;
              xAxis.labelProvider.formatCursorLabel = xAxisLabelFormatter;

              yAxis.labelProvider.formatLabel = yAxisLabelFormatter;
              yAxis.labelProvider.formatCursorLabel = yAxisLabelFormatter;

              const bidPriceDataSeries = new XyDataSeries(wasmContext, {
                  containsNaN: true,
                  dataIsSortedInX: true,
                  dataSeriesName: seriesName,
              });

              const lineSeries = new FastLineRenderableSeries(wasmContext, {
                  strokeThickness: 1,
                  stroke: seriesColor,
                  dataSeries: bidPriceDataSeries,
                  drawNaNAs: ELineDrawMode.PolyLine,
                  isDigitalLine: true,
                  paletteProvider: new DataPointSelectionPaletteProvider({fill: 'white', stroke: 'white'}),
              });

              sciChartSurface.xAxes.add(xAxis);
              sciChartSurface.yAxes.add(yAxis);

              sciChartSurface.renderableSeries.add(lineSeries);

              sciChartSurface.chartModifiers.add(...buildSharedChartModifiers());

              verticalGroup.addSurfaceToGroup(sciChartSurface);

              return [
                  containerDiv,
                  {
                      chartSurface: sciChartSurface,
                      wasmContext,
                      yAxis,
                      xAxis,
                      dataSeries: bidPriceDataSeries,
                      lineSeries: lineSeries,
                  },
              ];
          }

          const synchronizeAxis = (firstAxis: NumericAxis, secondAxis: NumericAxis) => {
              firstAxis.visibleRangeChanged.subscribe((data?: VisibleRangeChangedArgs | undefined) => {
                  if (data?.visibleRange) {
                      secondAxis.visibleRange = data.visibleRange;
                  }
              });

              secondAxis.visibleRangeChanged.subscribe((data?: VisibleRangeChangedArgs | undefined) => {
                  if (data?.visibleRange) {
                      firstAxis.visibleRange = data.visibleRange;
                  }
              });
          };

        //   const synchronizeRolloverModifers = (firstModifier: RolloverModifier, secondModifier: RolloverModifier) => {
        //     firstModifier.modifierMouseMove
        //   };

          try {
              const res = await Promise.all([
                  initLineChartAsync('line-chart-1', 'BidPrice', '#2c8916'),
                  initLineChartAsync('line-chart-2', 'TradePrice', '#891688'),
              ]);
              res.forEach(([chartId, chartComponents]) => {
                  chartComponents.chartSurface.zoomExtents();
                  if (chartId === 'line-chart-1') {
                      lineChart1Ref.current = chartComponents;
                  } else {
                      lineChart2Ref.current = chartComponents;
                  }
              });

              if (!lineChart1Ref.current || !lineChart2Ref.current) {
                  return;
              }

              synchronizeAxis(lineChart1Ref.current.xAxis, lineChart2Ref.current.xAxis);
            //   synchronizeAxis(lineChart1Ref.current.yAxis, lineChart2Ref.current.yAxis);
          } catch (error) {
              console.error(error);
          }
      }

      initChartsAsync();
  }, []);

  const loadData = (canHaveNaNs: boolean) => {
      if (!lineChart1Ref.current || !lineChart2Ref.current) {
          return;
      }

      setTitleSuffix(canHaveNaNs ? '(with NaNs in data)' : '(without NaNs in data)');

      const randomWalk = new RandomWalkGenerator();
      const maxDataPoints = 100;

      const timeArray: number[] = [];
      const bidPrices: number[] = [];
      const tradePrices: number[] = [];

      let initialTime = new Date();
      for (let i = 0; i < maxDataPoints; i++) {
          timeArray.push(initialTime.getTime());
          initialTime = addSeconds(initialTime, 20);
      }
      bidPrices.push(...randomWalk.getRandomWalkSeries(maxDataPoints));
      tradePrices.push(...randomWalk.getRandomWalkSeries(maxDataPoints));

      const bidPriceData: TXyValues = {
          x: [...timeArray],
          y: [...randomWalk.getRandomWalkSeries(maxDataPoints)],
      };

      // Set some of the items in TradePrice array to NaNs
      for (let i = 0; i < maxDataPoints; i++) {
          if (Math.random() <= 0.5) {
              tradePrices[i] = NaN;
          }
      }

      const tradePriceData: TXyValues = {
          x: [],
          y: [],
      };

      for (let i = 0; i < maxDataPoints; i++) {
          const tradePrice = tradePrices[i];
          if (isNaN(tradePrice)) {
              if (canHaveNaNs) {
                  // Use items with NaN in tradePrice array
                  tradePriceData.x.push(timeArray[i]);
                  tradePriceData.y.push(tradePrice);
              } else {
                  // do not add tradePrice and corresponding time as
                  // tradePrice is NaN
              }
          } else {
              tradePriceData.x.push(timeArray[i]);
              tradePriceData.y.push(tradePrice);
          }
      }

      const lineChart1Components = lineChart1Ref.current;
      const lineChart2Components = lineChart2Ref.current;

      UpdateSuspender.using(lineChart1Components.chartSurface, () => {
          const { x, y } = bidPriceData;
          const { dataSeries, lineSeries } = lineChart1Components;
          dataSeries.clear();
          dataSeries.appendRange(x, y);
          lineSeries.xAxis.autoRange = EAutoRange.Once;
          lineSeries.yAxis.autoRange = EAutoRange.Once;
          lineChart1Components.chartSurface.zoomExtents();
      });
      UpdateSuspender.using(lineChart2Components.chartSurface, () => {
          const { x, y } = tradePriceData;
          const { dataSeries, lineSeries } = lineChart2Components;
          dataSeries.clear();
          dataSeries.appendRange(x, y);
          lineSeries.xAxis.autoRange = EAutoRange.Once;
          lineSeries.yAxis.autoRange = EAutoRange.Once;
          lineChart2Components.chartSurface.zoomExtents();
      });
  };

  return (
      <div>
          <h2>{`SciChart Line Chart ${titleSuffix}`}</h2>
          <div>
              <button className="button" onClick={() => loadData(true)}>
                  Load Data With NaNs
              </button>
              <button className="button" onClick={() => loadData(false)}>
                  Load Data Without NaNs
              </button>
          </div>
          <div id="line-chart-1" className='line-chart-container' />
          <div id="line-chart-2" className='line-chart-container' />
      </div>
  );
};

export default App;

