import { Quad } from "../mesh/Quad";
import { Inlet } from "./Inlet";
import { Layer } from "./Layer";
import { Meander } from "./Meander";
import { Outlet } from "./Outlet";

export class GradientGenerator {
    //general parameters
    nInlets: number;
    nOutlets: number;
    nLayers: number;
    nConnections: number;
    nMeanders: number;

    //channels
    inlets: Inlet[] = [];
    layers: Layer[] = [];
    meanders: Meander[][] = []; //[iLayer][iMeanderInsideLayer]
    outlets: Outlet[] = [];

    //geometrical parameters
    w: number;
    radius: number;
    lConnection: number;
    wMeanderMax: number;

    x: number = 0;
    y: number = 0;

    constructor(nOutlets: number, w: number, radius: number, lConnection: number) {
        this.nInlets = 2;
        this.nOutlets = nOutlets;
        this.nLayers = this.nOutlets - 2;
        this.nConnections = this.nLayers * this.nLayers + 3 * this.nLayers;
        this.nMeanders = Math.floor(0.5 * (this.nLayers + 5) * this.nLayers);
        this.w = w;
        this.radius = radius;
        this.lConnection = lConnection;
        this.wMeanderMax = 2 * lConnection - w;

        this.initialize();
    }

    getQuads(): Quad[] {
        let quads: Quad[] = [];

        //inlets
        for (let iInlet = 0; iInlet < this.nInlets; iInlet++) {
            quads = quads.concat(this.inlets[iInlet].getQuads());
        }

        //layers & meanders
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            //layer
            quads = quads.concat(this.layers[iLayer].getQuads());

            //meanders
            const meandersLayer = this.meanders[iLayer];
            for (let iMeander = 0; iMeander < meandersLayer.length; iMeander++) {
                quads = quads.concat(meandersLayer[iMeander].getQuads());
            }
        }

        //outlets
        for (let iOutlet = 0; iOutlet < this.nOutlets; iOutlet++) {
            quads = quads.concat(this.outlets[iOutlet].getQuads());
        }

        return quads;
    }

    initialize() {
        //inlets
        for (let iInlet = 0; iInlet < this.nInlets; iInlet++) {
            this.inlets.push(new Inlet(this.w));
        }

        //layers & meanders
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            //layers
            this.layers.push(new Layer(iLayer + 2, this.w, this.lConnection));

            //meanders
            const nMeandersLayer = iLayer + 3;
            const meandersLayer: Meander[] = [];
            this.meanders.push(meandersLayer);
            for (let iMeander = 0; iMeander < nMeandersLayer; iMeander++) {
                meandersLayer.push(new Meander());
            }
        }

        //outlets
        for (let iOutlet = 0; iOutlet < this.nOutlets; iOutlet++) {
            this.outlets.push(new Outlet(this.w));
        }
    }

    createGradientGenerator() {
        let x = this.x;
        let y = this.y;

        //inlets
        const lInletMax = this.inlets[0].l > this.inlets[1].l ? this.inlets[0].l : this.inlets[1].l;
        for (let iInlet = 0; iInlet < this.nInlets; iInlet++) {
            const inlet = this.inlets[iInlet];
            inlet.x = x + Layer.computeIndexFactor(iInlet, this.nInlets) * 2 * this.lConnection;
            inlet.y = y - lInletMax + this.inlets[iInlet].l / 2;
            inlet.createInlet();
        }

        //layers & meanders
        x += 0;
        y -= (lInletMax + this.w / 2);
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            //layer
            const layer = this.layers[iLayer];
            layer.x = x;
            layer.y = y;
            layer.createLayer();

            const meandersLayer = this.meanders[iLayer];
            for (let iMeander = 0; iMeander < meandersLayer.length; iMeander++) {
                const meander = meandersLayer[iMeander];
                const factor = Layer.computeIndexFactor(iMeander, meandersLayer.length);
                meander.x = x + 2 * this.lConnection * factor;
                // meander.y = y - (meander.hMeander + this.w) / 2;
                meander.y = y - meander.hMeander / 2;
                meander.createMeander();
            }
            // y -= this.meanders[iLayer][0].hMeander + this.w;
            y -= this.meanders[iLayer][0].hMeander;
        }

        //outlets (do not generate outlets)
        // for (let iOutlet = 0; iOutlet < this.nOutlets; iOutlet++) {
        //     const outlet = this.outlets[iOutlet];
        //     outlet.x = x + Layer.computeIndexFactor(iOutlet, this.nOutlets) * 2 * this.lConnection;
        //     outlet.y = y;
        //     outlet.createOutlet();
        // }

        //merge points of the different components
        this.mergePoints();
    }

    private mergePoints() {
        //layer nodes and meanders
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            const layer = this.layers[iLayer];

            //inlet nodes
            for (let iInletNode = 0; iInletNode < layer.nInlets; iInletNode++) {
                const inletNode = layer.inletNodes[iInletNode];
                //first layer is connected to inlets and has to be treated differently
                if (iLayer === 0) {
                    const inlet = this.inlets[iInletNode].inlets[0];
                    inlet.replacePoint(1, inletNode.edge2.point0);
                    inlet.replacePoint(0, inletNode.edge2.point1);
                } else {
                    const meander = this.meanders[iLayer - 1][iInletNode];
                    meander.outlet[0].replacePoint(1, inletNode.edge2.point0);
                    meander.outlet[0].replacePoint(0, inletNode.edge2.point1);
                }
            }

            //outlet nodes
            for (let iOutletNode = 0; iOutletNode < layer.nOutlets; iOutletNode++) {
                const outletNode = layer.outletNodes[iOutletNode];
                const meander = this.meanders[iLayer][iOutletNode];
                meander.inlet[0].replacePoint(3, outletNode.edge0.point0);
                meander.inlet[0].replacePoint(2, outletNode.edge0.point1);

                //last meanders have to be connected to outlets (omit since outlets are not present)
                // if (iLayer === this.nLayers - 1) {
                //     const outlet = this.outlets[iOutletNode].outlets[0];
                //     meander.outlet[0].replacePoint(1, outlet.edge2.point0);
                //     meander.outlet[0].replacePoint(0, outlet.edge2.point1);
                // }
            }
        }
    }
}