import { Edge } from "./Edge";
import { EdgeArc } from "./EdgeArc";
import { Point } from "./Point";

export class Quad {
    edge0: Edge;
    edge1: Edge;
    edge2: Edge;
    edge3: Edge;

    constructor(edge0: Edge, edge1: Edge, edge2: Edge, edge3: Edge) {
        this.edge0 = edge0;
        this.edge1 = edge1;
        this.edge2 = edge2;
        this.edge3 = edge3;
    }

    replacePoint(pointNumber: number, point: Point) {
        if (pointNumber === 0) {
            this.edge3.point1 = point;
            this.edge0.point0 = point;
        } else if (pointNumber === 1) {
            this.edge0.point1 = point;
            this.edge1.point0 = point;
        } else if (pointNumber === 2) {
            this.edge1.point1 = point;
            this.edge2.point0 = point;
        } else if (pointNumber === 3) {
            this.edge2.point1 = point;
            this.edge3.point0 = point;
        }
    }

    static createQuadPoints(point0: Point, point1: Point, point2: Point, point3: Point): Quad {
        return new Quad(
            new Edge(point0, point1),
            new Edge(point1, point2),
            new Edge(point2, point3),
            new Edge(point3, point0)
        )
    }

    static createQuadEdges(edgeStart: Edge, edgeEnd: Edge, reverseEdgeStart: boolean = false, reverseEdgeEnd: boolean = false): Quad {
        const point0 = reverseEdgeStart ? edgeStart.point1 : edgeStart.point0;
        const point1 = reverseEdgeStart ? edgeStart.point0 : edgeStart.point1;
        const point2 = reverseEdgeEnd ? edgeEnd.point1 : edgeEnd.point0;
        const point3 = reverseEdgeEnd ? edgeEnd.point0 : edgeEnd.point1;

        return new Quad(
            new Edge(point0, point1),
            new Edge(point1, point2),
            new Edge(point2, point3),
            new Edge(point3, point0)
        )
    }

    static createQuadSquare(xCenter: number, yCenter: number, width: number): Quad {
        return this.createQuadRectangle(xCenter, yCenter, width, width);
    }

    static createQuadRectangle(xCenter: number, yCenter: number, xWidth: number, yWidth: number): Quad {
        const point0 = new Point(xCenter - xWidth / 2, yCenter - yWidth / 2);
        const point1 = new Point(xCenter + xWidth / 2, yCenter - yWidth / 2);
        const point2 = new Point(xCenter + xWidth / 2, yCenter + yWidth / 2);
        const point3 = new Point(xCenter - xWidth / 2, yCenter + yWidth / 2);

        return new Quad(
            new Edge(point0, point1),
            new Edge(point1, point2),
            new Edge(point2, point3),
            new Edge(point3, point0)
        );
    }

    static createArc(point0: Point, point1: Point, interpolationPoint_12: Point, point2: Point, point3: Point, interpolationPoint_30: Point): Quad {
        return new Quad(
            new Edge(point0, point1),
            new EdgeArc(point1, point2, interpolationPoint_12),
            new Edge(point2, point3),
            new EdgeArc(point3, point0, interpolationPoint_30)
        );
    }
}