import { Point } from "../mesh/Point";
import { Quad } from "../mesh/Quad";

interface MeanderDimensions {
    w: number,
    radius: number,
    wMeander: number,
    hMeander: number,
    nArcs: number,
}

export class Meander {
    inlet: Quad[] = [];
    outlet: Quad[] = [];
    straightChannels: Quad[] = [];
    leftArcs: Quad[] = [];
    rightArcs: Quad[] = [];

    w: number = 500e-6;
    wMeander: number = 5000e-6;
    hMeander: number = 20000e-6;
    nArcs: number = 10;
    radius: number = this.w;

    x: number = 0;
    y: number = 0;

    private l0 = 0;
    private l1 = 0;
    private l2 = 0;

    setDimensions(dimensions: MeanderDimensions) {
        this.w = dimensions.w;
        this.radius = dimensions.radius;
        this.wMeander = dimensions.wMeander;
        this.hMeander = dimensions.hMeander;
        this.nArcs = dimensions.nArcs;
    }

    getQuads(): Quad[] {
        return this.inlet.concat(this.outlet, this.straightChannels, this.leftArcs, this.rightArcs);
    }

    createMeander() {
        //compute temporary values
        this.l0 = 0.5 * this.hMeander - this.radius * (this.nArcs + 1);
        this.l1 = this.wMeander - 2 * this.radius - this.w;
        this.l2 = 0.5 * (this.wMeander - this.w) - 2 * this.radius;

        //create inlet
        this.createInlet();

        //create outlet
        let isOutletFromRight = this.nArcs % 2 === 0;
        this.createOutlet(isOutletFromRight);

        //create straight channels
        this.createStraightChannels();

        //create arcs
        this.createArcs();
    }

    private createInlet() {
        let rMin = this.radius - this.w / 2;
        let rMax = this.radius + this.w / 2;

        //inlet0
        let xCenter = this.x;
        let yCenter = this.y + this.hMeander / 2 - this.l0 / 2;
        const inlet0 = Quad.createQuadRectangle(xCenter, yCenter, this.w, this.l0);

        //inlet2
        xCenter = this.x - this.radius - this.l2 / 2;
        yCenter = this.y + this.hMeander / 2 - this.l0 - this.radius;
        const inlet2 = Quad.createQuadRectangle(xCenter, yCenter, this.l2, this.w);

        //inlet1 (arc)
        const point0 = inlet0.edge0.point1;
        const point1 = inlet0.edge0.point0;
        const point2 = inlet2.edge1.point1;
        const point3 = inlet2.edge1.point0;
        xCenter = this.x - this.radius;
        yCenter = this.y + this.hMeander / 2 - this.l0;
        const iPoint_12 = new Point(xCenter + rMin / Math.sqrt(2), yCenter - rMin / Math.sqrt(2));
        const iPoint_30 = new Point(xCenter + rMax / Math.sqrt(2), yCenter - rMax / Math.sqrt(2));
        const inlet1 = Quad.createArc(point0, point1, iPoint_12, point2, point3, iPoint_30);
        // const inlet1 = Quad.createQuadEdges(inlet0.edge0, inlet2.edge1, true, true);

        this.inlet.push(inlet0);
        this.inlet.push(inlet1);
        this.inlet.push(inlet2);
    }

    private createOutlet(isOutletFromRight: boolean) {
        let rMin = this.radius - this.w / 2;
        let rMax = this.radius + this.w / 2;

        //outlet0
        let xCenter = this.x;
        let yCenter = this.y - this.hMeander / 2 + this.l0 / 2;
        const outlet0 = Quad.createQuadRectangle(xCenter, yCenter, this.w, this.l0);

        //outlet2
        xCenter = isOutletFromRight ? this.x + this.radius + this.l2 / 2 : this.x - this.radius - this.l2 / 2;
        yCenter = this.y - this.hMeander / 2 + this.l0 + this.radius;
        const outlet2 = Quad.createQuadRectangle(xCenter, yCenter, this.l2, this.w);

        //outlet1 (arc)
        const point0 = outlet0.edge2.point1;
        const point1 = outlet0.edge2.point0;
        const point2 = isOutletFromRight ? outlet2.edge3.point1 : outlet2.edge1.point1;
        const point3 = isOutletFromRight ? outlet2.edge3.point0 : outlet2.edge1.point0;
        xCenter = isOutletFromRight ? this.x + this.radius : this.x - this.radius;
        yCenter = this.y - this.hMeander / 2 + this.l0;
        const iPoint_12 = isOutletFromRight ?
            new Point(xCenter - rMin / Math.sqrt(2), yCenter + rMin / Math.sqrt(2)) :
            new Point(xCenter + rMax / Math.sqrt(2), yCenter + rMax / Math.sqrt(2));
        const iPoint_30 = isOutletFromRight ?
            new Point(xCenter - rMax / Math.sqrt(2), yCenter + rMax / Math.sqrt(2)) :
            new Point(xCenter + rMin / Math.sqrt(2), yCenter + rMin / Math.sqrt(2));
        const outlet1 = Quad.createArc(point0, point1, iPoint_12, point2, point3, iPoint_30);

        this.outlet.push(outlet0);
        this.outlet.push(outlet1);
        this.outlet.push(outlet2);
    }

    private createStraightChannels() {
        for (let i = 1; i < this.nArcs; i++) {
            let xCenter = this.x;
            let yCenter = this.y + this.hMeander / 2 - this.l0 - this.radius * (2 * i + 1);
            this.straightChannels.push(Quad.createQuadRectangle(xCenter, yCenter, this.l1, this.w));
        }
    }

    private createArcs() {
        for (let i = 0; i < this.nArcs; i++) {
            let topChannel: Quad;
            if (i === 0) {
                topChannel = this.inlet[2];
            } else {
                topChannel = this.straightChannels[i - 1];
            }

            let bottomChannel: Quad;
            if (i === this.nArcs - 1) {
                bottomChannel = this.outlet[2];
            } else {
                bottomChannel = this.straightChannels[i];
            }

            if (i % 2 === 0) {
                this.createLeftArc(topChannel, bottomChannel);
            } else {
                this.createRightArc(topChannel, bottomChannel);
            }
        }
    }

    private createLeftArc(topChannel: Quad, bottomChannel: Quad) {
        //a 180° arc consist of two smaller 90° arcs

        //get points from channels
        const point2_arc0 = topChannel.edge3.point1;
        const point3_arc0 = topChannel.edge3.point0;
        const point2_arc1 = bottomChannel.edge3.point1;
        const point3_arc1 = bottomChannel.edge3.point0;

        //compute center of arc
        const xCenter = point2_arc0.x;
        const yCenter = (point2_arc0.y + point3_arc1.y) / 2;

        //create common points
        const rMin = this.radius - this.w / 2;
        const rMax = this.radius + this.w / 2;
        const point0_arc0 = new Point(xCenter - rMax, yCenter);
        const point1_arc0 = new Point(xCenter - rMin, yCenter);
        const point0_arc1 = point1_arc0;
        const point1_arc1 = point0_arc0;

        //create interpolation Points
        const iPoint_12_arc0 = new Point(xCenter - rMin / Math.sqrt(2), yCenter + rMin / Math.sqrt(2));
        const iPoint_30_arc0 = new Point(xCenter - rMax / Math.sqrt(2), yCenter + rMax / Math.sqrt(2));
        const iPoint_12_arc1 = new Point(xCenter - rMax / Math.sqrt(2), yCenter - rMax / Math.sqrt(2));
        const iPoint_30_arc1 = new Point(xCenter - rMin / Math.sqrt(2), yCenter - rMin / Math.sqrt(2));

        //create arcs (arc0 and arc1)
        this.leftArcs.push(Quad.createArc(point0_arc0, point1_arc0, iPoint_12_arc0, point2_arc0, point3_arc0, iPoint_30_arc0));
        this.leftArcs.push(Quad.createArc(point0_arc1, point1_arc1, iPoint_12_arc1, point2_arc1, point3_arc1, iPoint_30_arc1));
    }

    private createRightArc(topChannel: Quad, bottomChannel: Quad) {
        //a 180° arc consist of two smaller 90° arcs

        //get points from channels
        const point2_arc0 = topChannel.edge1.point1;
        const point3_arc0 = topChannel.edge1.point0;
        const point2_arc1 = bottomChannel.edge1.point1;
        const point3_arc1 = bottomChannel.edge1.point0;

        //compute center of arc
        const xCenter = point2_arc0.x;
        const yCenter = (point3_arc0.y + point2_arc1.y) / 2;

        //create common points
        const rMin = this.radius - this.w / 2;
        const rMax = this.radius + this.w / 2;
        const point0_arc0 = new Point(xCenter + rMin, yCenter);
        const point1_arc0 = new Point(xCenter + rMax, yCenter);
        const point0_arc1 = point1_arc0;
        const point1_arc1 = point0_arc0;

        //create interpolation Points
        const iPoint_12_arc0 = new Point(xCenter + rMax / Math.sqrt(2), yCenter + rMax / Math.sqrt(2));
        const iPoint_30_arc0 = new Point(xCenter + rMin / Math.sqrt(2), yCenter + rMin / Math.sqrt(2));
        const iPoint_12_arc1 = new Point(xCenter + rMin / Math.sqrt(2), yCenter - rMin / Math.sqrt(2));
        const iPoint_30_arc1 = new Point(xCenter + rMax / Math.sqrt(2), yCenter - rMax / Math.sqrt(2));

        //create arcs (arc0 and arc1)
        this.rightArcs.push(Quad.createArc(point0_arc0, point1_arc0, iPoint_12_arc0, point2_arc0, point3_arc0, iPoint_30_arc0));
        this.rightArcs.push(Quad.createArc(point0_arc1, point1_arc1, iPoint_12_arc1, point2_arc1, point3_arc1, iPoint_30_arc1));
    }
}