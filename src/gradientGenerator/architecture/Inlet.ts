import { Quad } from "../mesh/Quad";

export class Inlet {
    inlets: Quad[] = [];

    w: number;
    l: number = 1000e-6;

    x: number = 0;
    y: number = 0;

    constructor(w: number) {
        this.w = w;
    }

    getQuads(): Quad[] {
        return this.inlets;
    }

    createInlet() {
        this.inlets.push(Quad.createQuadRectangle(this.x, this.y, this.w, this.l));
    }
}