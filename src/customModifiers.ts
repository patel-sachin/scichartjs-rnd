import {
  DataPointSelectionModifier,
  ESelectionMode,
  IDataPointSelectionModifierOptions,
} from 'scichart/Charting/ChartModifiers/DataPointSelectionModifier';
import { ModifierMouseArgs } from 'scichart/Charting/ChartModifiers/ModifierMouseArgs';
import {
  IRubberBandXyZoomModifierOptions,
  RubberBandXyZoomModifier,
} from 'scichart/Charting/ChartModifiers/RubberBandXyZoomModifier';
import { IYAxisDragModifierOptions, YAxisDragModifier } from 'scichart/Charting/ChartModifiers/YAxisDragModifier';
import { IZoomPanModifierOptions, ZoomPanModifier } from 'scichart/Charting/ChartModifiers/ZoomPanModifier';
import { Point } from 'scichart/Core/Point';
import { EDragMode } from 'scichart/types/DragMode';

export class TimeSeriesZoomPanModifier extends ZoomPanModifier {
  constructor(options?: IZoomPanModifierOptions) {
    super(options);
  }

  override modifierMouseDown(args: ModifierMouseArgs) {
    if (!args.ctrlKey && !args.shiftKey && !args.altKey) {
      super.modifierMouseDown(args);
    }
  }
}

export class TimeSeriesRubberBandXyZoomModifier extends RubberBandXyZoomModifier {
  constructor(options?: IRubberBandXyZoomModifierOptions) {
    super(options);
  }

  override modifierMouseDown(args: ModifierMouseArgs) {
    if (args.shiftKey) {
      super.modifierMouseDown(args);
    }
  }
}

export class TimeSeriesDataPointSelectionModifier extends DataPointSelectionModifier {
  constructor(options?: IDataPointSelectionModifierOptions) {
    super(options);
  }

  override modifierMouseDown(args: ModifierMouseArgs) {
    if (args.ctrlKey) {
      super.modifierMouseDown(args);
    }
  }

  protected selectSinglePoint(point: Point) {
    super.selectSinglePoint(point, ESelectionMode.Replace);
  }
}

export class TimeSeriesYAxisDragModifier extends YAxisDragModifier {
  constructor(options?: IYAxisDragModifierOptions) {
    super(options);
  }

  override modifierMouseWheel(args: ModifierMouseArgs) {
    if (args.ctrlKey) {
      this.dragMode = EDragMode.Scaling;
    } else {
      this.dragMode = EDragMode.Panning;
    }
    super.modifierMouseWheel(args);
  }

  override modifierMouseDown(args: ModifierMouseArgs) {
    if (args.ctrlKey) {
      this.dragMode = EDragMode.Scaling;
    } else {
      this.dragMode = EDragMode.Panning;
    }
    super.modifierMouseDown(args);
  }
}
