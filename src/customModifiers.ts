import {
  DataPointSelectionModifier,
  IDataPointSelectionModifierOptions
} from "scichart/Charting/ChartModifiers/DataPointSelectionModifier";
import {
  RubberBandXyZoomModifier,
  IRubberBandXyZoomModifierOptions
} from "scichart/Charting/ChartModifiers/RubberBandXyZoomModifier";
import {
  ZoomPanModifier,
  IZoomPanModifierOptions
} from "scichart/Charting/ChartModifiers/ZoomPanModifier";

export class TimeSeriesZoomPanModifier extends ZoomPanModifier {
  constructor(options?: IZoomPanModifierOptions) {
    super(options);
    this.isEnabled = false;
  }

  private handleKeyUpOrKeyDownEvent(e: KeyboardEvent) {
    this.isEnabled = e.ctrlKey;
    // console.log(
    //   `ZPM | isEnabled: ${this.isEnabled} | ctrl: ${e.ctrlKey} | shift: ${e.shiftKey}`
    // );
  }

  onAttach() {
    super.onAttach();
    this.parentSurface.domChartRoot.tabIndex =
      this.parentSurface.domChartRoot.tabIndex || 0;
    this.parentSurface.domChartRoot.addEventListener(
      "keyup",
      this.handleKeyUpOrKeyDownEvent
    );
    this.parentSurface.domChartRoot.addEventListener(
      "keydown",
      this.handleKeyUpOrKeyDownEvent
    );
  }

  onDetach() {
    this.parentSurface.domChartRoot.removeEventListener(
      "keyup",
      this.handleKeyUpOrKeyDownEvent
    );
    this.parentSurface.domChartRoot.removeEventListener(
      "keydown",
      this.handleKeyUpOrKeyDownEvent
    );
    super.onDetach();
  }
}

export class TimeSeriesRubberBandXyZoomModifier extends RubberBandXyZoomModifier {
  constructor(options?: IRubberBandXyZoomModifierOptions) {
    super(options);
    this.isEnabled = false;
  }

  private handleKeyUpOrKeyDownEvent(e: KeyboardEvent) {
    this.isEnabled = e.shiftKey;
    console.log(
      `RBM | isEnabled: ${this.isEnabled} | ctrl: ${e.ctrlKey} | shift: ${e.shiftKey}`
    );
  }

  onAttach() {
    super.onAttach();
    this.parentSurface.domChartRoot.tabIndex =
      this.parentSurface.domChartRoot.tabIndex || 0;
    this.parentSurface.domChartRoot.addEventListener(
      "keyup",
      this.handleKeyUpOrKeyDownEvent
    );
    this.parentSurface.domChartRoot.addEventListener(
      "keydown",
      this.handleKeyUpOrKeyDownEvent
    );
  }

  onDetach() {
    this.parentSurface.domChartRoot.removeEventListener(
      "keyup",
      this.handleKeyUpOrKeyDownEvent
    );
    this.parentSurface.domChartRoot.removeEventListener(
      "keydown",
      this.handleKeyUpOrKeyDownEvent
    );
    super.onDetach();
  }
}

export class TimeSeriesDataPointSelectionModifier extends DataPointSelectionModifier {
  constructor(options?: IDataPointSelectionModifierOptions) {
    super(options);
    this.isEnabled = true;
  }

  private handleKeyUpOrKeyDownEvent(e: KeyboardEvent) {
    this.isEnabled = !e.ctrlKey && !e.shiftKey;
    console.log(
      `DPM | isEnabled: ${this.isEnabled} | ctrl: ${e.ctrlKey} | shift: ${e.shiftKey}`
    );
  }

  onAttach() {
    super.onAttach();
    this.parentSurface.domChartRoot.tabIndex =
      this.parentSurface.domChartRoot.tabIndex || 0;
    this.parentSurface.domChartRoot.addEventListener(
      "keyup",
      this.handleKeyUpOrKeyDownEvent
    );
    this.parentSurface.domChartRoot.addEventListener(
      "keydown",
      this.handleKeyUpOrKeyDownEvent
    );
  }

  onDetach() {
    this.parentSurface.domChartRoot.removeEventListener(
      "keyup",
      this.handleKeyUpOrKeyDownEvent
    );
    this.parentSurface.domChartRoot.removeEventListener(
      "keydown",
      this.handleKeyUpOrKeyDownEvent
    );
    super.onDetach();
  }
}
