import {
    DataPointSelectionModifier,
    ESelectionMode,
    IDataPointSelectionModifierOptions,
} from 'scichart/Charting/ChartModifiers/DataPointSelectionModifier';
import { ILegendModifierOptions, LegendModifier } from 'scichart/Charting/ChartModifiers/LegendModifier';
import { ModifierMouseArgs } from 'scichart/Charting/ChartModifiers/ModifierMouseArgs';
import {
    EActionType,
    IMouseWheelZoomModifierOptions,
    MouseWheelZoomModifier,
} from 'scichart/Charting/ChartModifiers/MouseWheelZoomModifier';
import {
    IRubberBandXyZoomModifierOptions,
    RubberBandXyZoomModifier,
} from 'scichart/Charting/ChartModifiers/RubberBandXyZoomModifier';
import { IYAxisDragModifierOptions, YAxisDragModifier } from 'scichart/Charting/ChartModifiers/YAxisDragModifier';
import { IZoomPanModifierOptions, ZoomPanModifier } from 'scichart/Charting/ChartModifiers/ZoomPanModifier';
import { IRenderableSeries } from 'scichart/Charting/Visuals/RenderableSeries/IRenderableSeries';
import { Point } from 'scichart/Core/Point';
import { EDragMode } from 'scichart/types/DragMode';
import { testIsInBounds } from 'scichart/utils/pointUtil';

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
        console.log('ctor | %o', options);
    }

    // override modifierMouseEnter(args: ModifierMouseArgs) {
    //   if (args.shiftKey) {
    //     this.dragMode = EDragMode.Scaling;
    //     console.log('mouseEnter | Shift pressed | setting dragMode to Scaling');
    //   } else {
    //     this.dragMode = EDragMode.Panning;
    //     console.log('mouseEnter | no Shift pressed | setting dragMode to Panning');
    //   }
    //   super.modifierMouseEnter(args);
    // }

    // override modifierMouseWheel(args: ModifierMouseArgs) {
    //   if (args.shiftKey) {
    //     this.dragMode = EDragMode.Scaling;
    //     console.log('mouseWheel | Shift pressed | setting dragMode to Scaling');
    //   } else {
    //     this.dragMode = EDragMode.Panning;
    //     console.log('mouseWheel | no Shift pressed | setting dragMode to Panning');
    //   }
    //   super.modifierMouseWheel(args);
    // }

    override modifierMouseDown(args: ModifierMouseArgs) {
        if (args.shiftKey) {
            super.dragMode = EDragMode.Scaling;
        } else {
            super.dragMode = EDragMode.Panning;
        }
        super.modifierMouseDown(args);
    }
}

enum EHitTestChartAreaType {
    NONE = 'NONE',
    X_AXIS = 'X_AXIS',
    Y_AXIS = 'Y_AXIS',
    MAIN_CHART_AREA = 'MAIN_CHART_AREA',
}

export class TimeSeriesMouseWheelZoomModifier extends MouseWheelZoomModifier {
    constructor(options?: IMouseWheelZoomModifierOptions) {
        super(options);
    }

    override modifierMouseWheel(args: ModifierMouseArgs) {
        const hitTestArea = this.getHitTestArea(args.mousePoint);

        if (args.ctrlKey) {
            if (this.isHitTestInAnyAxis(hitTestArea)) {
                this.actionType = EActionType.Zoom;
            } else {
                // no-op
            }
        } else if (this.isHitTestInAnyAxis(hitTestArea)) {
            this.actionType = EActionType.Pan;
        } else if (this.isHitTestInMainChartArea(hitTestArea)) {
            this.actionType = EActionType.Zoom;
        }

        super.modifierMouseWheel(args);
    }

    private getHitTestArea(mousePoint: Point) {
        let hitTestArea = EHitTestChartAreaType.NONE;

        this.parentSurface?.yAxes.asArray().forEach((yAxis) => {
            if (hitTestArea > EHitTestChartAreaType.NONE) {
                return;
            }
            const { left, right, top, bottom } = yAxis.viewRect;
            if (testIsInBounds(mousePoint.x, mousePoint.y, left, bottom, right, top)) {
                hitTestArea = EHitTestChartAreaType.Y_AXIS;
            }
        });

        if (hitTestArea > EHitTestChartAreaType.NONE) {
            return hitTestArea;
        }

        // Check if the mouse was over an XAxis
        this.parentSurface?.xAxes.asArray().forEach((xAxis) => {
            if (hitTestArea > EHitTestChartAreaType.NONE) {
                return;
            }
            const { left, right, top, bottom } = xAxis.viewRect;
            if (testIsInBounds(mousePoint.x, mousePoint.y, left, bottom, right, top)) {
                hitTestArea = EHitTestChartAreaType.X_AXIS;
            }
        });

        if (hitTestArea > EHitTestChartAreaType.NONE) {
            return hitTestArea;
        }

        // Check if the mouse was over the main chart area
        const { left, right, top, bottom } = this.parentSurface?.seriesViewRect;
        if (testIsInBounds(mousePoint.x, mousePoint.y, left, bottom, right, top)) {
            hitTestArea = EHitTestChartAreaType.MAIN_CHART_AREA;
        }

        return hitTestArea;
    }

    private isHitTestInAnyAxis(hitTest: EHitTestChartAreaType) {
        return hitTest === EHitTestChartAreaType.X_AXIS || hitTest === EHitTestChartAreaType.Y_AXIS;
    }

    private isHitTestInMainChartArea(hitTest: EHitTestChartAreaType) {
        return hitTest === EHitTestChartAreaType.MAIN_CHART_AREA;
    }
}
