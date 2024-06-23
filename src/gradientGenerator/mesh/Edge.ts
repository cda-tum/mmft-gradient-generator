import { Point } from "./Point";

export class Edge {
    point0: Point;
    point1: Point;

    constructor(point0: Point, point1: Point) {
        this.point0 = point0;
        this.point1 = point1;
    }

    equals(edge: Edge): boolean {
        return (this.point0 === edge.point0 && this.point1 === edge.point1) || (this.point0 === edge.point1 && this.point1 === edge.point0);
    }

    length(): number {
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

        let content = `L ${endPoint.x.toExponential(3)} ${endPoint.y.toExponential(3)}\n`;

        //check if startPoint should be included (first edge inside an SVG path)
        if (includeStartPoint) {
            content = `M ${startPoint.x.toExponential(3)} ${startPoint.y.toExponential(3)}\n` + content;
        }

        return content;
    }

    //TODO: implement methods to check if two edges intersect
    //https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
}