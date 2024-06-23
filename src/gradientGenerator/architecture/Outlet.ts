import { Point } from "../mesh/Point";
import { Quad } from "../mesh/Quad";
import { Layer } from "./Layer";

export class Outlet {
    outlets: Quad[] = [];

    indexFactor: number = 0;

    w: number;
    l: number = 1000e-6;
    l0: number = 0;
    l1: number = 0;

    x: number = 0;
    y: number = 0;

    constructor(w: number) {
        this.w = w;
    }

    static computeAngularOutletLength(w: number, iOutlet: number, nOutlets: number, lConnection: number) {
        //compute height of the outlet area (l0 + l2)
        //is identical for all outlets
        const hOutlet = nOutlets % 2 === 0 ? w * (nOutlets + 1) : w * nOutlets;

        //compute l1 (differs between each outlet)
        const factor = Math.abs(Layer.computeIndexFactor(iOutlet, nOutlets));
        const l1 = 2 * factor * (lConnection - w) - w;

        return hOutlet + l1 + w;
    }

    setAngularOutlet(iOutlet: number, nOutlets: number, lConnection: number) {
        this.indexFactor = Layer.computeIndexFactor(iOutlet, nOutlets);

        const factor = Math.abs(this.indexFactor);

        //the outlet in the middle is still a straight outlet
        if (factor === 0) {
            this.l = Outlet.computeAngularOutletLength(this.w, iOutlet, nOutlets, lConnection);
            return;
        }

        this.l0 = nOutlets % 2 === 0 ? 2 * factor * this.w : (2 * factor - 1) * this.w;
        this.l1 = 2 * factor * (lConnection - this.w) - this.w;
        this.l = Outlet.computeAngularOutletLength(this.w, iOutlet, nOutlets, lConnection);
    }

    getQuads(): Quad[] {
        return this.outlets;
    }

    createOutlet() {
        let x = this.x;
        let y = this.y;

        if (this.indexFactor === 0) {
            this.outlets.push(Quad.createQuadRectangle(x, y - this.l / 2, this.w, this.l));
        } else if (this.indexFactor < 0) {
            //outlet from left

            //outlet1
            y = this.y - (this.l0 + this.w / 2);
            const outlet1 = Quad.createQuadSquare(x, y, this.w);

            //outlet3
            x = this.x + (this.l1 + this.w);
            const outlet3 = Quad.createQuadSquare(x, y, this.w);

            //outlet2
            const outlet2 = Quad.createQuadPoints(outlet1.edge1.point0, outlet3.edge3.point1, outlet3.edge3.point0, outlet1.edge1.point1)

            //outlet0
            x = this.x;
            y = this.y;
            const outlet0 = Quad.createQuadPoints(outlet1.edge2.point1, outlet1.edge2.point0, new Point(x + this.w / 2, y), new Point(x - this.w / 2, y))

            //outlet4
            x = this.x + this.l1 + this.w;
            y = this.y - (this.l - this.l1 - this.w);
            const outlet4 = Quad.createQuadPoints(new Point(x - this.w / 2, y), new Point(x + this.w / 2, y), outlet3.edge0.point1, outlet3.edge0.point0);

            this.outlets.push(outlet0, outlet1, outlet2, outlet3, outlet4);
        } else {
            //outlet from right

            //outlet1
            y = this.y - (this.l0 + this.w / 2);
            const outlet1 = Quad.createQuadSquare(x, y, this.w);

            //outlet3
            x = this.x - (this.l1 + this.w);
            const outlet3 = Quad.createQuadSquare(x, y, this.w);

            //outlet2
            const outlet2 = Quad.createQuadPoints(outlet3.edge1.point0, outlet1.edge3.point1, outlet1.edge3.point0, outlet3.edge1.point1);

            //outlet0
            x = this.x;
            y = this.y;
            const outlet0 = Quad.createQuadPoints(outlet1.edge2.point1, outlet1.edge2.point0, new Point(x + this.w / 2, y), new Point(x - this.w / 2, y));

            //outlet4
            x = this.x - (this.l1 + this.w);
            y = this.y - (this.l - this.l1 - this.w);
            const outlet4 = Quad.createQuadPoints(new Point(x - this.w / 2, y), new Point(x + this.w / 2, y), outlet3.edge0.point1, outlet3.edge0.point0);

            this.outlets.push(outlet0, outlet1, outlet2, outlet3, outlet4);
        }
    }
}