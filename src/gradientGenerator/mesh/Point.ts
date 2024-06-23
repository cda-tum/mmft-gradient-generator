export class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals(point: Point): boolean {
        return this.x == point.x && this.y == point.y;
    }

    close(point: Point, radius: number): boolean {
        return this.distance(point) <= Math.abs(radius);
    }

    distance(point: Point): number {
        return Math.sqrt(Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2))
    }
}