import "./styles.scss";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle
} from "react";
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { libraryVersion } from "scichart/Core/BuildStamp";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import { XyDataSeries } from "scichart/Charting/Model/XyDataSeries";
import { FastLineRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { MouseWheelZoomModifier } from "scichart/Charting/ChartModifiers/MouseWheelZoomModifier";
import { ZoomExtentsModifier } from "scichart/Charting/ChartModifiers/ZoomExtentsModifier";
import { EExecuteOn } from "scichart/types/ExecuteOn";
import { CursorModifier } from "scichart/Charting/ChartModifiers/CursorModifier";
import { EAxisAlignment } from "scichart/types/AxisAlignment";
import { SciChartVerticalGroup } from "scichart/Charting/LayoutManager/SciChartVerticalGroup";
import { Thickness } from "scichart/Core/Thickness";
import { UpdateSuspender } from "scichart/Charting/Visuals/UpdateSuspender";
import { TSciChart } from "scichart/types/TSciChart";
import { XAxisDragModifier } from "scichart/Charting/ChartModifiers/XAxisDragModifier";
import { EDragMode } from "scichart/types/DragMode";
import { ChartModifierBase2D } from "scichart/Charting/ChartModifiers/ChartModifierBase2D";
import { LegendModifier } from "scichart/Charting/ChartModifiers/LegendModifier";
import { RolloverModifier } from "scichart/Charting/ChartModifiers/RolloverModifier";
import {
  ELegendOrientation,
  ELegendPlacement
} from "scichart/Charting/Visuals/Legend/SciChartLegendBase";
import { ELineDrawMode } from "scichart/Charting/Drawing/WebGlRenderContext2D";
import { addMilliseconds, format } from "date-fns";
import { SeriesInfo } from "scichart/Charting/Model/ChartData/SeriesInfo";
import { EAutoRange } from "scichart/types/AutoRange";
import {
  DataPointSelectionPaletteProvider,
  EPointMarkerType,
  SciChartDefaults
} from "scichart";
import {
  TimeSeriesDataPointSelectionModifier,
  TimeSeriesRubberBandXyZoomModifier,
  TimeSeriesYAxisDragModifier,
  TimeSeriesZoomPanModifier
} from "./customModifiers";

// Load Wasm & Data files from URL
// This URL can be anything, but for example purposes we are loading from JSDelivr CDN
SciChartSurface.configure({
  dataUrl: `https://cdn.jsdelivr.net/npm/scichart@${libraryVersion}/_wasm/scichart2d.data`,
  wasmUrl: `https://cdn.jsdelivr.net/npm/scichart@${libraryVersion}/_wasm/scichart2d.wasm`
});

function xAxisLabelFormatter(dataValue: number): string {
  const time = format(dataValue, "HH:mm:ss");
  return time;
}

function yAxisLabelFormatter(dataValue: number): string {
  return dataValue.toFixed(4);
}

class RandomWalkGenerator {
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

type TChartComponents = {
  chartSurface: SciChartSurface;
  wasmContext: TSciChart;
  xAxis: NumericAxis;
  yAxis: NumericAxis;
  dataSeries: XyDataSeries;
  lineSeries: FastLineRenderableSeries;
};

interface IZoomRatioDisplay {
  update: (ratio: number) => void;
}

const SluggishChart = () => {
  const chartComponentsMapRef = useRef<Map<string, TChartComponents>>(
    new Map()
  );

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
            placement: ELegendPlacement.TopRight
          }),
          new RolloverModifier({
            modifierGroup: "group1",
            showRolloverLine: false,
            snapToDataPoint: true,
            tooltipDataTemplate: (
              seriesInfo: SeriesInfo,
              tooltipTitle: string
            ): string[] => {
              const valuesWithLabels = [];
              valuesWithLabels.push(tooltipTitle);
              valuesWithLabels.push("-----------------");
              valuesWithLabels.push(`x: ${seriesInfo.formattedXValue}`);
              valuesWithLabels.push(`y: ${seriesInfo.formattedYValue}`);
              return valuesWithLabels;
            }
          }),
          new CursorModifier({ modifierGroup: "group1" }),
          new XAxisDragModifier({
            dragMode: EDragMode.Scaling
          }),
          new TimeSeriesYAxisDragModifier({
            dragMode: EDragMode.Scaling
          }),
          new TimeSeriesZoomPanModifier({
            executeOn: EExecuteOn.MouseLeftButton
          }),
          new TimeSeriesRubberBandXyZoomModifier({
            isAnimated: false,
            executeOn: EExecuteOn.MouseRightButton
          }),
          new TimeSeriesDataPointSelectionModifier({
            executeOn: EExecuteOn.MouseLeftButton,
            allowDragSelect: false
          })
        ];
      }

      async function initLineChartAsync(
        containerDiv: string,
        seriesInfos: { seriesName: string; seriesColor: string }[]
      ): Promise<TChartComponents[]> {
        const { sciChartSurface, wasmContext } = await SciChartSurface.create(
          containerDiv
        );
        sciChartSurface.padding = Thickness.fromNumber(5);
        sciChartSurface.background = "black";
        const chartComponents: TChartComponents[] = [];

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

          isVisible: true
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
          axisAlignment: EAxisAlignment.Left
        });

        xAxis.labelProvider.formatLabel = xAxisLabelFormatter;
        xAxis.labelProvider.formatCursorLabel = xAxisLabelFormatter;

        yAxis.labelProvider.formatLabel = yAxisLabelFormatter;
        yAxis.labelProvider.formatCursorLabel = yAxisLabelFormatter;

        sciChartSurface.xAxes.add(xAxis);
        sciChartSurface.yAxes.add(yAxis);

        sciChartSurface.chartModifiers.add(...buildSharedChartModifiers());

        verticalGroup.addSurfaceToGroup(sciChartSurface);

        seriesInfos.forEach((info) => {
          const dataSeries = new XyDataSeries(wasmContext, {
            containsNaN: false,
            dataIsSortedInX: true,
            dataSeriesName: info.seriesName
          });

          const lineSeries = new FastLineRenderableSeries(wasmContext, {
            strokeThickness: 1,
            stroke: info.seriesColor,
            dataSeries: dataSeries,
            drawNaNAs: ELineDrawMode.PolyLine,
            isDigitalLine: true,
            pointMarker: {
              type: EPointMarkerType.Ellipse,
              options: {
                fill: info.seriesColor,
                stroke: info.seriesColor,
                width: 2,
                height: 2
              }
            },
            // Uncomment this when SciChart releases a new version with performance fix
            //  - This is causing severe sluggishness in the chart
            paletteProvider: new DataPointSelectionPaletteProvider({
              fill: "white",
              stroke: "white"
            })
          });

          sciChartSurface.renderableSeries.add(lineSeries);

          chartComponents.push({
            chartSurface: sciChartSurface,
            wasmContext,
            yAxis,
            xAxis,
            dataSeries: dataSeries,
            lineSeries: lineSeries
          });
        });
        return chartComponents;
      }

      try {
        const res = await Promise.all([
          initLineChartAsync("line-chart-1", [
            { seriesName: "BidQty", seriesColor: "#2c8916" },
            { seriesName: "AskQty", seriesColor: "#884dff" }
          ]),
          initLineChartAsync("line-chart-2", [
            { seriesName: "TradePrice", seriesColor: "#891688" }
          ])
        ]);

        res.forEach((chartComponentsArray) => {
          chartComponentsArray.forEach((chartComponents) => {
            chartComponentsMapRef.current.set(
              chartComponents.dataSeries.dataSeriesName,
              chartComponents
            );
            chartComponents.chartSurface.zoomExtents();
          });
        });
      } catch (error) {
        console.error(error);
      }
    }

    SciChartDefaults.asyncLabels = true;
    SciChartDefaults.useSharedCache = true;
    SciChartDefaults.enableResampling = true;
    SciChartDefaults.performanceWarnings = false;

    initChartsAsync();
  }, []);

  const loadData = (canHaveNaNs: boolean) => {
    const maxDataPoints = Math.pow(10, 6);
    // const dataCountPerFragment = maxDataPoints / Math.pow(10, 3);
    // const maxFragments = maxDataPoints / Math.pow(10, 3);
    const dataCountPerFragment = Math.pow(10, 4);
    const maxFragments = Math.floor(maxDataPoints / dataCountPerFragment);
    const startTime = new Date();

    const fillQtyData = (
      chartComponents: TChartComponents,
      priceMultiplier: number
    ) => {
      UpdateSuspender.using(chartComponents.chartSurface, () => {
        const ratios: number[] = [];
        for (let i = 0; i < 10; i++) {
          ratios[i] = Math.random();
        }
        const { dataSeries, lineSeries } = chartComponents;
        dataSeries.clear();
        let initialTime = new Date(startTime);
        for (let f = 0; f < maxFragments; f++) {
          const x: number[] = [];
          const y: number[] = [];
          for (let j = 0; j < dataCountPerFragment; j++) {
            x.push(initialTime.getTime());
            y.push(
              Math.random() *
                ratios[Math.floor(Math.random() * 10)] *
                Math.random() *
                priceMultiplier
            );
            initialTime = addMilliseconds(
              initialTime,
              Math.floor(Math.random() * 100)
            );
          }
          dataSeries.appendRange(x, y);
        }
        console.log(
          "%s | dataCount: %i",
          dataSeries.dataSeriesName,
          dataSeries.count()
        );
        lineSeries.xAxis.autoRange = EAutoRange.Once;
        lineSeries.yAxis.autoRange = EAutoRange.Once;
        chartComponents.chartSurface.zoomExtents();
      });
    };

    const fillPriceData = (chartComponents: TChartComponents) => {
      UpdateSuspender.using(chartComponents.chartSurface, () => {
        const randomWalk = new RandomWalkGenerator();
        const { dataSeries, lineSeries } = chartComponents;
        dataSeries.clear();
        let initialTime = new Date(startTime);
        for (let f = 0; f < maxFragments; f++) {
          const x: number[] = [];
          const y: number[] = [
            ...randomWalk.getRandomWalkSeries(dataCountPerFragment)
          ];
          for (let j = 0; j < dataCountPerFragment; j++) {
            x.push(initialTime.getTime());
            initialTime = addMilliseconds(
              initialTime,
              Math.floor(Math.random() * 100)
            );
          }
          dataSeries.appendRange(x, y);
        }
        console.log(
          "%s | dataCount: %i",
          dataSeries.dataSeriesName,
          dataSeries.count()
        );
        lineSeries.xAxis.autoRange = EAutoRange.Once;
        lineSeries.yAxis.autoRange = EAutoRange.Once;
        chartComponents.chartSurface.zoomExtents();
      });
    };

    chartComponentsMapRef.current.forEach((chartComponents, seriesName) => {
      switch (seriesName) {
        // case "BidQty":
        //   fillQtyData(chartComponents, 3000);
        //   break;
        // case "AskQty":
        //   fillQtyData(chartComponents, 1000);
        //   break;
        // case "TradePrice":
        //   fillPriceData(chartComponents);
        //   break;
        default:
          fillPriceData(chartComponents);
          break;
      }
    });
  };

  return (
    <div>
      <div className="header">
        <h2>SciChart Line Chart - Sluggish Chart Behavior</h2>
        <button className="button" onClick={() => loadData(true)}>
          Load Lots Of Data
        </button>
      </div>
      <div id="line-chart-1" className="line-chart-container" />
      <div id="line-chart-2" className="line-chart-container" />
      <div className="info">
        <div>
          <p className="tag">Pan:</p>
          <p>Left mouse</p>
        </div>
        <div>
          <p className="tag">Zoom in/out:</p>
          <p>Mouse Wheel</p>
        </div>
        <div>
          <p className="tag">RubberBand Zoom:</p>
          <p>Shift + Left Mouse</p>
        </div>
        <div>
          <p className="tag">Select DataPoint:</p>
          <p>Ctrl + Left mouse</p>
        </div>
        <div>
          <p className="tag">Y-Axis Drag: Pan:</p>
          <p>Mouse Wheel Or Left Mouse</p>
        </div>
        <div>
          <p className="tag">Y-Axis Drag: Zoom:</p>
          <p>Ctrl + (Mouse Wheel Or Left Mouse)</p>
        </div>
        <div>
          <p className="tag">X-Axis Drag: Pan:</p>
          <p>N/A</p>
        </div>
        <div>
          <p className="tag">X-Axis Drag: Zoom</p>
          <p>Ctrl + (Mouse Wheel Or Left Mouse)</p>
        </div>
      </div>
    </div>
  );
};

export default SluggishChart;
