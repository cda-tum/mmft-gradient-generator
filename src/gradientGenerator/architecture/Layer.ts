import { Quad } from "../mesh/Quad";

export class Layer {
    nInlets: number;
    nOutlets: number;
    nChannels: number;
    inletNodes: Quad[] = [];
    outletNodes: Quad[] = [];
    channels: Quad[] = [];

    w: number;
    lChannel: number;

    x: number = 0;
    y: number = 0;

    constructor(nInlets: number, w: number, lChannel: number) {
        this.nInlets = nInlets;
        this.nOutlets = nInlets + 1;
        this.nChannels = 2 * nInlets;

        this.w = w;
        this.lChannel = lChannel;
    }

    getQuads(): Quad[] {
        return this.inletNodes.concat(this.outletNodes, this.channels);
    }

    static computeIndexFactor(index: number, numberOfIndices: number): number {
        return index - (numberOfIndices - 1) / 2.0;
    }

    createLayer() {
        // create nodes for inlets
        for (let iInlet = 0; iInlet < this.nInlets; iInlet++) {
            let factor = Layer.computeIndexFactor(iInlet, this.nInlets);
            let xCenter = this.x + factor * 2 * this.lChannel;
            let yCenter = this.y;

            this.inletNodes.push(Quad.createQuadSquare(xCenter, yCenter, this.w));
        }

        // create nodes for outlets
        for (let iOutlet = 0; iOutlet < this.nOutlets; iOutlet++) {
            let factor = Layer.computeIndexFactor(iOutlet, this.nOutlets);
            let xCenter = this.x + factor * 2 * this.lChannel;
            let yCenter = this.y;

            this.outletNodes.push(Quad.createQuadSquare(xCenter, yCenter, this.w));
        }

        // connect channels between nodes
        let iInlet = 0;
        let iOutlet = 0;
        for (let iChannel = 0; iChannel < this.nChannels; iChannel++) {
            //get left and right node of each channel
            let nodeLeft: Quad
            let nodeRight: Quad;
            if (iChannel % 2 === 0) {
                nodeLeft = this.outletNodes[iOutlet];
                nodeRight = this.inletNodes[iInlet];
                iOutlet++;
            } else {
                nodeLeft = this.inletNodes[iInlet];
                nodeRight = this.outletNodes[iOutlet];
                iInlet++;
            }

            //create channel
            this.channels.push(Quad.createQuadEdges(nodeLeft.edge1, nodeRight.edge3));
            // this.channels.push(new Quad(nodeLeft.edges[0].point1, nodeRight.edges[0].point0, nodeRight.edges[2].point1, nodeLeft.edges[2].point0))
        }

        //TODO: create FaceGroups
    }
}