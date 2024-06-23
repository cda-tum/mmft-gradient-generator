import { Edge } from "./Edge";
import { Point } from "./Point";

export class EdgeArc extends Edge {
    interpolationPoint: Point;

    constructor(point0: Point, point1: Point, interpolationPoint: Point) {
        super(point0, point1);
        this.interpolationPoint = interpolationPoint;
    }

    equals(edge: Edge): boolean {
        if (edge instanceof EdgeArc) {
            return super.equals(edge) && this.interpolationPoint === edge.interpolationPoint;
        }

        return false;
    }

    length(): number {
        // TODO
        return this.point0.distance(this.point1);
    }

    hasPoint(point: Point): boolean {
        return this.point0 === point || this.point1 === point;
    }

    isConnected(edge: Edge): boolean {
        return this.hasPoint(edge.point0) || this.hasPoint(edge.point1);
    }

    getSVGString(isPoint0StartPoint: boolean, includeStartPoint: boolean): string {
        //get start and end point (the direction to draw)
        const startPoint = isPoint0StartPoint ? this.point0 : this.point1;
        const endPoint = isPoint0StartPoint ? this.point1 : this.point0;
        const arcValues = this.computeArcValues();

        // let content = `A ${arcValues.r.toExponential(3)} ${arcValues.r.toExponential(3)} 0 ${arcValues.largeArcFlag.toFixed(0)} ${arcValues.sweepFlag.toFixed(0)} ${endPoint.x.toExponential(3)} ${endPoint.y.toExponential(3)}\n`;
        let content = `A ${arcValues.r.toFixed(8)} ${arcValues.r.toFixed(8)} 0 ${arcValues.largeArcFlag.toFixed(0)} ${arcValues.sweepFlag.toFixed(0)} ${endPoint.x.toFixed(8)} ${endPoint.y.toFixed(8)}\n`;

        //check if startPoint should be included (first edge inside an SVG path)
        if (includeStartPoint) {
            content = `M ${startPoint.x.toExponential(3)} ${startPoint.y.toExponential(3)}\n` + content;
        }

        return content;
    }

    computeArcValues(): { r: number, largeArcFlag: number, sweepFlag: number } {
        // https://math.stackexchange.com/questions/213658/get-the-equation-of-a-circle-when-given-3-points
        // arc has three points
        const x1 = this.point0.x;
        const y1 = this.point0.y;
        const x2 = this.point1.x;
        const y2 = this.point1.y;
        const x3 = this.interpolationPoint.x;
        const y3 = this.interpolationPoint.y;

        // compute temporary values
        const a1 = 2 * (x2 - x1);
        const a2 = 2 * (x3 - x1);
        const b1 = 2 * (y2 - y1);
        const b2 = 2 * (y3 - y1);
        const c1 = x2 * x2 - x1 * x1 + y2 * y2 - y1 * y1;
        const c2 = x3 * x3 - x1 * x1 + y3 * y3 - y1 * y1;

        // center of the arc
        const xc = (c1 * b2 - b1 * c2) / (a1 * b2 - b1 * a2);
        const yc = (c1 * a2 - a1 * c2) / (b1 * a2 - a1 * b2);

        // radius
        const rx = x1 - xc;
        const ry = y1 - yc;
        const r = Math.sqrt(rx * rx + ry * ry);

        // compute sweep-flag (on which side of the line (vStar, vEnd) lies the interpolation point
        // determinant of vectors (vEnd - vStart, vInterpolation - vStart)
        let determinant = Math.sign((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1));
        const sweepFlag = determinant > 0.5 ? 0 : 1;

        // compute large-arc-flag (does the center point lie on the same side as the interpolation point)
        // determinant of vectors (vEnd - vStart, vCenter - vStart)
        determinant = Math.sign((x2 - x1) * (yc - y1) - (y2 - y1) * (xc - x1));
        let largeArcFlag = determinant > 0.5 ? 0 : 1;
        largeArcFlag = largeArcFlag === sweepFlag ? 1 : 0;

        return { r, sweepFlag, largeArcFlag };
    }

}