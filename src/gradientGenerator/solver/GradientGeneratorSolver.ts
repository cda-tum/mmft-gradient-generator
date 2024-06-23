import { lusolve } from 'mathjs';
import { MeanderGroupSolver } from './MeanderGroupSolver';
import { MeanderSolver } from './MeanderSolver';
// import { Matrix, solve as mlMatrixSolve } from 'ml-matrix';
// import {eig} from 'eigen';
import { ResistanceModel } from "./ResistanceModel";

class Channel {
    l: number = 0;   //length
    r: number = 0;   //hydrodynamic resistance
    q: number = 0;   //volumetric flow rate
    c: number = 0;   //concentration
}

export class GradientGeneratorSolver {
    //general parameters
    nInlets: number;
    nOutlets: number;
    nLayers: number;
    nConnections: number;
    nMeanders: number;

    //channels
    inlets: Channel[] = [];
    connections: Channel[][] = [];  //[iLayer][iConnectionInsideLayer]
    meanders: Channel[][] = []; //[iLayer][iMeanderInsideLayer]
    outlets: Channel[] = [];

    //hydrodynamic resistances
    rModel: ResistanceModel;

    //geometrical parameters
    w: number;
    h: number;
    radius: number;
    lConnection: number;
    wMeanderMax: number;

    //mixing parameters
    tMin: number;    //minimal time the two fluids need to mix properly

    error = { id: '', message: '' };


    constructor(nOutlets: number, w: number, h: number, radius: number, lConnection: number, mu: number, tMin: number) {
        this.nInlets = 2;
        this.nOutlets = nOutlets;
        this.nLayers = this.nOutlets - 2;
        this.nConnections = this.nLayers * this.nLayers + 3 * this.nLayers;
        this.nMeanders = Math.floor(0.5 * (this.nLayers + 5) * this.nLayers);
        this.w = w;
        this.h = h;
        this.radius = radius;
        this.lConnection = lConnection;
        this.wMeanderMax = 2 * lConnection - w;
        this.rModel = new ResistanceModel(mu);
        this.tMin = tMin;

        this.initialize();
    }

    initialize() {
        //inlets
        for (let iInlet = 0; iInlet < this.nInlets; iInlet++) {
            this.inlets.push(new Channel());
        }

        //connections & meanders
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            //connections
            const nConnectionsLayer = 4 + iLayer * 2;
            const connectionsLayer: Channel[] = [];
            this.connections.push(connectionsLayer);
            for (let iConnection = 0; iConnection < nConnectionsLayer; iConnection++) {
                const connection = new Channel();
                connection.l = this.lConnection;
                connectionsLayer.push(connection);
            }

            //meanders
            const nMeandersLayer = 3 + iLayer;
            const meandersLayer: Channel[] = [];
            this.meanders.push(meandersLayer);
            for (let iMeander = 0; iMeander < nMeandersLayer; iMeander++) {
                meandersLayer.push(new Channel());
            }
        }

        //outlets
        for (let iOutlet = 0; iOutlet < this.nOutlets; iOutlet++) {
            this.outlets.push(new Channel());
        }
    }

    initializeResistances() {
        //inlets
        for (const inlet of this.inlets) {
            inlet.r = this.rModel.computeResistance(this.w, this.h, inlet.l);
        }

        //connection
        for (const connectionLayer of this.connections) {
            for (const connection of connectionLayer) {
                connection.r = this.rModel.computeResistance(this.w, this.h, connection.l);
            }
        }

        //outlets
        for (const outlet of this.outlets) {
            outlet.r = this.rModel.computeResistance(this.w, this.h, outlet.l);
        }
    }

    initializeConcentrations() {
        //meanders
        //start with last layer and compute concentration values
        for (let iLayer = this.nLayers - 1; iLayer >= 0; iLayer--) {
            const meanderLayer = this.meanders[iLayer];

            //loop through meanders inside the layer
            for (let iMeander = 0; iMeander < meanderLayer.length; iMeander++) {
                if (iLayer === this.nLayers - 1) {
                    //the last layer of meanders has the same concentration values as the outlets,
                    meanderLayer[iMeander].c = this.outlets[iMeander].c;
                } else {
                    //otherwise it is the average of the two succeeding meanders (inside the next layer)
                    //except for the first and last meander, where the concentration is the same as the first and last meander of the succeeding layer
                    if (iMeander === 0) {
                        meanderLayer[iMeander].c = this.meanders[iLayer + 1][iMeander].c;
                    } else if (iMeander === meanderLayer.length - 1) {
                        meanderLayer[iMeander].c = this.meanders[iLayer + 1][iMeander + 1].c;
                    } else {
                        meanderLayer[iMeander].c = (this.meanders[iLayer + 1][iMeander].c + this.meanders[iLayer + 1][iMeander + 1].c) / 2;
                    }
                }
            }
        }

        //connections
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            const connectionLayer = this.connections[iLayer];

            //loop through connections inside the layer (always two at a time are processed)
            for (let iConnection = 0; iConnection < connectionLayer.length / 2; iConnection++) {
                if (iLayer === 0) {
                    //the first layer of connections has the same concentration values as the inlets,
                    connectionLayer[2 * iConnection].c = this.inlets[iConnection].c;
                    connectionLayer[2 * iConnection + 1].c = this.inlets[iConnection].c;
                } else {
                    //otherwise it is the concentration value of the previous meander
                    connectionLayer[2 * iConnection].c = this.meanders[iLayer - 1][iConnection].c;
                    connectionLayer[2 * iConnection + 1].c = this.meanders[iLayer - 1][iConnection].c;
                }
            }
        }
    }


    solve(): boolean {
        //initialize
        this.initializeResistances();
        this.initializeConcentrations();

        //solve for flow Rates
        this.solveQ();

        //solve for resistances
        const result = this.solveR();
        this.error.id = result.id;
        this.error.message = result.message;

        return !result.error;
    }

    private createMatrixArray(nRows: number, nColumns: number, value: number): number[][] {
        const matrix: number[][] = [];
        for (let iRow = 0; iRow < nRows; iRow++) {
            const matrixRow: number[] = [];
            matrix.push(matrixRow);
            for (let iColumn = 0; iColumn < nColumns; iColumn++) {
                matrixRow.push(value);
            }
        }

        return matrix;
    }


    private indexInlet(iInlet: number): number {
        return iInlet;
    }

    private indexConnection(iLayer: number, iConnection: number): number {
        return this.nInlets + iLayer * iLayer + 3 * iLayer + iConnection;
    }

    private indexMeander(iLayer: number, iMeander: number): number {
        return this.nInlets + this.nConnections + Math.floor(0.5 * (iLayer + 5) * iLayer) + iMeander;
    }

    private indexOutlet(iOutlet: number): number {
        return this.nInlets + this.nConnections + this.nMeanders + iOutlet;
    }

    private indexMeanderMiddle(iLayer: number) {
        let nMeandersLayer = 3 + iLayer;
        let iMeander = Math.floor(nMeandersLayer / 2);
        if (nMeandersLayer % 2 == 0) {
            iMeander -= 1;
        }

        return iMeander;
    }

    private solveQ(): void {
        const N = this.nInlets + this.nConnections + this.nMeanders + this.nOutlets;

        const A = this.createMatrixArray(N, N, 0);
        const b = this.createMatrixArray(N, 1, 0);

        // node equations
        let iRow = 0;
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            let iConnection = 0;
            let iMeander = 0;

            // first node in layer
            A[iRow][this.indexConnection(iLayer, iConnection)] = 1;
            A[iRow++][this.indexMeander(iLayer, iMeander++)] = -1;

            // check if first layer because this layer is connected to the inlets and has to be treated differently
            if (iLayer == 0) {
                // first inlet node
                A[iRow][this.indexInlet(0)] = 1;
                A[iRow][this.indexConnection(iLayer, iConnection++)] = -1;
                A[iRow++][this.indexConnection(iLayer, iConnection)] = -1;

                // middle node
                A[iRow][this.indexConnection(iLayer, iConnection++)] = 1;
                A[iRow][this.indexConnection(iLayer, iConnection)] = 1;
                A[iRow++][this.indexMeander(iLayer, iMeander++)] = -1;

                // second inlet node
                A[iRow][this.indexInlet(0)] = 1;
                A[iRow][this.indexConnection(iLayer, iConnection++)] = -1;
                A[iRow++][this.indexConnection(iLayer, iConnection)] = -1;
            } else {
                // nodes in the middle
                let nNodes = 3 + 2 * iLayer;
                for (let iNode = 0; iNode < nNodes; iNode++) {
                    // distinguish between meanders that are "inlets" or "outlets" (with respect to the current layer)
                    if (iNode % 2 == 0) {
                        // "inlet" meanders
                        A[iRow][this.indexMeander(iLayer - 1, iMeander - 1)] = 1;
                        A[iRow][this.indexConnection(iLayer, iConnection++)] = -1;
                        A[iRow++][this.indexConnection(iLayer, iConnection)] = -1;
                    } else {
                        // "outlet" meanders
                        A[iRow][this.indexConnection(iLayer, iConnection++)] = 1;
                        A[iRow][this.indexConnection(iLayer, iConnection)] = 1;
                        A[iRow++][this.indexMeander(iLayer, iMeander++)] = -1;
                    }
                }
            }

            // last node in layer
            A[iRow][this.indexConnection(iLayer, iConnection)] = 1;
            A[iRow++][this.indexMeander(iLayer, iMeander)] = -1;
        }

        // node equations for outlets
        for (let iOutlet = 0; iOutlet < this.nOutlets; iOutlet++) {
            A[iRow][this.indexMeander(this.nLayers - 1, iOutlet)] = 1;
            A[iRow++][this.indexOutlet(iOutlet)] = -1;
        }

        // concentration equations
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            let nMeandersLayer = 3 + iLayer;
            for (let iMeander = 1; iMeander < nMeandersLayer - 1; iMeander++) {
                // left input
                A[iRow][this.indexConnection(iLayer, 2 * iMeander - 1)] = this.connections[iLayer][2 * iMeander - 1].c;
                // right input
                A[iRow][this.indexConnection(iLayer, 2 * iMeander)] = this.connections[iLayer][2 * iMeander].c;
                // output into meander
                A[iRow++][this.indexMeander(iLayer, iMeander)] = -this.meanders[iLayer][iMeander].c
            }
        }

        // set known values
        // first inlet
        A[iRow][this.indexInlet(0)] = 1;
        b[iRow++][0] = this.inlets[0].q;
        // second inlet
        A[iRow][this.indexInlet(1)] = 1;
        b[iRow++][0] = this.inlets[1].q;
        // outlets
        for (let iOutlet = 1; iOutlet < this.nOutlets - 1; iOutlet++) {
            A[iRow][this.indexOutlet(iOutlet)] = 1;
            b[iRow++][0] = this.outlets[iOutlet].q;
        }

        // iRow should now be N

        // solve equation system
        const q = lusolve(A, b) as number[][];

        //write to channels
        //inlets
        this.inlets[0].q = q[this.indexInlet(0)][0];
        this.inlets[1].q = q[this.indexInlet(1)][0];

        //connections & meanders
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            //connections
            const nConnectionsLayer = this.connections[iLayer].length;
            for (let iConnection = 0; iConnection < nConnectionsLayer; iConnection++) {
                this.connections[iLayer][iConnection].q = q[this.indexConnection(iLayer, iConnection)][0];
            }

            //meanders
            const nMeandersLayer = this.meanders[iLayer].length;
            for (let iMeander = 0; iMeander < nMeandersLayer; iMeander++) {
                this.meanders[iLayer][iMeander].q = q[this.indexMeander(iLayer, iMeander)][0];
            }
        }

        //outlets
        for (let iOutlet = 0; iOutlet < this.nOutlets; iOutlet++) {
            this.outlets[iOutlet].q = q[this.indexOutlet(iOutlet)][0];
        }
    }

    private solveR(): { error: boolean, id: string, message: string } {
        //solve resistances of meanders for each layer individually
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            //compute middle meander index
            //the resistance of this meander is assumed to be "known" and is altered to find the best value
            const iMeanderMiddle = this.indexMeanderMiddle(iLayer);

            //create matrix
            //A*x = b, where x is the vector with the resistances of the meanders in this layer
            const nMeandersLayer = 3 + iLayer;
            const A = this.createMatrixArray(nMeandersLayer, nMeandersLayer, 0);
            const b = this.createMatrixArray(nMeandersLayer, 1, 0);

            //build equations for each loop in this layer
            const nLoops = 2 + iLayer;
            for (let iLoop = 0; iLoop < nLoops; iLoop++) {
                // set entries in A
                A[iLoop][iLoop] = this.meanders[iLayer][iLoop].q;
                A[iLoop][iLoop + 1] = -this.meanders[iLayer][iLoop + 1].q;

                //set entry in b
                const connection0 = this.connections[iLayer][2 * iLoop];    //top left connection inside the loop
                const connection1 = this.connections[iLayer][2 * iLoop + 1];    //top right connection inside the loop
                let bi = connection0.q * connection0.r - connection1.q * connection1.r;
                //last layer has to be treated differently, because meanders are connected to outlets
                if (iLayer != this.nLayers - 1) {
                    const connection3 = this.connections[iLayer + 1][2 * iLoop + 1];    //bottom left connection inside the loop
                    const connection4 = this.connections[iLayer + 1][2 * iLoop + 2];    //bottom right connection inside the loop
                    bi += connection3.q * connection3.r - connection4.q * connection4.r;
                } else {
                    const outlet0 = this.outlets[iLoop];    //bottom left outlet inside the loop
                    const outlet1 = this.outlets[iLoop + 1];    //bottom right outlet inside the loop
                    bi += outlet0.q * outlet0.r - outlet1.q * outlet1.r
                }
                b[iLoop][0] = -bi;
            }

            //set the entry in A for the "known" resistance
            A[nMeandersLayer - 1][iMeanderMiddle] = 1;

            //find the minimal rM_iMeanderMiddle so that all conditions for each rM_i are satisfied
            //search is conducted with a binary search in the following region
            //when no valid value is found within the range, the method returns false
            //TODO: Probably this task is a "Linear Programming" problem => take a closer look into it and check for libraries

            //compute minimal values for resistances
            const rL = this.rModel.computeResistance(this.w, this.h, 1.0);  //unit resistance value (multiplied with a length gives the real resistance)
            const rMinT = this.tMin * this.meanders[iLayer][iMeanderMiddle].q * rL / (this.w * this.h); //minimal resistance that is necessary to fullfil the mixing constraint (tMin must be satisfied)
            const rMinMeander = (4 * this.w + 2 * this.radius * Math.PI) * rL;  //minimal resistance (length) a meander is able to realize


            let left = rMinT > rMinMeander ? rMinT : rMinMeander;   //get the greater of the two for the start value
            let right = 100 * left;
            const delta = rL * 1e-6;  // delta is 1um in length

            let result: number[][] | undefined;
            while (right - left > delta) {
                let middle = (right + left) / 2;

                //the last entry in b is the value for the "known" resistance
                b[nMeandersLayer - 1][0] = middle;

                //solve equation system
                const x = lusolve(A, b) as number[][];

                if (this.checkConditions(x, iLayer)) {
                    right = middle;
                    result = x;
                } else {
                    left = middle;
                }
            }


            if (result) {
                for (let iMeander = 0; iMeander < nMeandersLayer; iMeander++) {
                    const meander = this.meanders[iLayer][iMeander];
                    meander.r = result[iMeander][0];
                    meander.l = meander.r / rL;
                }
            } else {
                // console.log("No valid Value for rMs[" + iLayer + "] can be found!");
                return { error: true, id: `rMeanders-${iLayer}`, message: `Cannot find valid meander resistance for ${iLayer + 1}.Layer` };
            }
        }

        return { error: false, id: ``, message: `` };

    }

    private solveR2() {
        //solve resistances of meanders for each layer individually
        for (let iLayer = 0; iLayer < this.nLayers; iLayer++) {
            //compute middle meander index
            //the resistance of this meander is assumed to be "known" and is altered to find the best value
            const iMeanderMiddle = this.indexMeanderMiddle(iLayer);

            //create matrix
            //A*x = b, where x is the vector with the resistances of the meanders in this layer
            const nMeandersLayer = 3 + iLayer;
            const A = this.createMatrixArray(nMeandersLayer, nMeandersLayer, 0);
            const b = this.createMatrixArray(nMeandersLayer, 1, 0);

            //build equations for each loop in this layer
            const nLoops = 2 + iLayer;
            for (let iLoop = 0; iLoop < nLoops; iLoop++) {
                // set entries in A
                A[iLoop][iLoop] = this.meanders[iLayer][iLoop].q;
                A[iLoop][iLoop + 1] = -this.meanders[iLayer][iLoop + 1].q;

                //set entry in b
                const connection0 = this.connections[iLayer][2 * iLoop];    //top left connection inside the loop
                const connection1 = this.connections[iLayer][2 * iLoop + 1];    //top right connection inside the loop
                let bi = connection0.q * connection0.r - connection1.q * connection1.r;
                //last layer has to be treated differently, because meanders are connected to outlets
                if (iLayer != this.nLayers - 1) {
                    const connection3 = this.connections[iLayer + 1][2 * iLoop + 1];    //bottom left connection inside the loop
                    const connection4 = this.connections[iLayer + 1][2 * iLoop + 2];    //bottom right connection inside the loop
                    bi += connection3.q * connection3.r - connection4.q * connection4.r;
                } else {
                    const outlet0 = this.outlets[iLoop];    //bottom left outlet inside the loop
                    const outlet1 = this.outlets[iLoop + 1];    //bottom right outlet inside the loop
                    bi += outlet0.q * outlet0.r - outlet1.q * outlet1.r
                }
                b[iLoop][0] = -bi;
            }

            //set the entry in A for the "known" resistance
            A[nMeandersLayer - 1][iMeanderMiddle] = 1;

            //find the minimal rM_iMeanderMiddle so that all conditions for each rM_i are satisfied
            //search is conducted with a binary search in the following region
            //when no valid value is found within the range, the method returns false
            //TODO: Probably this task is a "Linear Programming" problem => take a closer look into it and check for libraries

            //compute minimal values for resistances
            const rL = this.rModel.computeResistance(this.w, this.h, 1.0);  //unit resistance value (multiplied with a length gives the real resistance)
            const rMinT = this.tMin * this.meanders[iLayer][iMeanderMiddle].q * rL / (this.w * this.h); //minimal resistance that is necessary to fullfil the mixing constraint (tMin must be satisfied)
            const rMinMeander = (4 * this.w + 2 * this.radius * Math.PI) * rL;  //minimal resistance (length) a meander is able to realize

            let left = rMinT > rMinMeander ? rMinT : rMinMeander;   //get the greater of the two for the start value
            left = rL * this.lConnection;
            let right = 100 * left;
            const delta = rL * 1e-6;  // delta is 1um in length

            let result: number[][] | undefined;
            while (right - left > delta) {
                let middle = (right + left) / 2;

                //the last entry in b is the value for the "known" resistance
                b[nMeandersLayer - 1][0] = middle;

                //solve equation system
                const x = lusolve(A, b) as number[][];

                if (this.checkConditions(x, iLayer)) {
                    right = middle;
                    result = x;
                } else {
                    left = middle;
                }
            }


            if (result) {
                for (let iMeander = 0; iMeander < nMeandersLayer; iMeander++) {
                    const meander = this.meanders[iLayer][iMeander];
                    meander.r = result[iMeander][0];
                    meander.l = meander.r / rL;
                }
            } else {
                console.log("No valid Value for rMs[" + iLayer + "] can be found!");
                return false;
            }
        }

        return true;
    }


    private checkConditions(rMsLayer: number[][], iLayer: number) {
        const rL = this.rModel.computeResistance(this.w, this.h, 1.0); // unit resistance value (multiplied with a length gives the real resistance)

        //find rMeanderMax and rMeanderMin and check for tMin
        let rMeanderMax = -1;
        let rMeanderMin = -1;
        for (let iMeander = 0; iMeander < rMsLayer.length; iMeander++) {
            let rMi = rMsLayer[iMeander][0];
            if (rMi > rMeanderMax || rMeanderMax == -1) {
                rMeanderMax = rMi;
            }
            if (rMi < rMeanderMin || rMeanderMin == -1) {
                rMeanderMin = rMi;
            }

            //check if tMin is satisfied (the first and last meander do not have to be checked, since no mixing occurs in them)
            if (iMeander !== 0 && iMeander !== rMsLayer.length - 1) {
                if (this.tMin > this.w * this.h * rMi / (this.meanders[iLayer][iMeander].q * rL)) {
                    return false;
                }
            }
        }

        //the largest resistance determines the minimal heigh of the meander area
        const hMMin = MeanderSolver.computeMinimalHeightMeander(rMeanderMax / rL, this.radius, this.w, this.wMeanderMax);

        //check if rMeanderMin can be realized with this value of hM
        const rMeanderMinRealizable = rL * (hMMin + 2 * this.radius * (Math.PI - 2) + 2 * this.w);

        return rMeanderMin > rMeanderMinRealizable;
    }

    private checkConditions2(rMsLayer: number[][], iLayer: number) {
        //unit resistance value (multiplied with a length gives the real resistance)
        const rL = this.rModel.computeResistance(this.w, this.h, 1.0);





        //find rMeanderMax and rMeanderMin and check for tMin
        let rMeanderMax = -1;
        let rMeanderMin = -1;
        const lDesired: number[] = [];
        for (let iMeander = 0; iMeander < rMsLayer.length; iMeander++) {

            let rMi = rMsLayer[iMeander][0];
            lDesired[iMeander] = rMi / rL;
            if (rMi > rMeanderMax || rMeanderMax == -1) {
                rMeanderMax = rMi;
            }
            if (rMi < rMeanderMin || rMeanderMin == -1) {
                rMeanderMin = rMi;
            }

            //check if tMin is satisfied (the first and last meander do not have to be checked, since no mixing occurs in them)
            if (iMeander !== 0 && iMeander !== rMsLayer.length - 1) {
                if (this.tMin > this.w * this.h * rMi / (this.meanders[iLayer][iMeander].q * rL)) {
                    return false;
                }
            }
        }

        const solver = new MeanderGroupSolver(this.w, this.radius, this.wMeanderMax, lDesired);
        solver.solve();

        //the largest resistance determines the minimal heigh of the meander area
        const hMMin = MeanderSolver.computeMinimalHeightMeander(rMeanderMax / rL, this.radius, this.w, this.wMeanderMax);

        //check if rMeanderMin can be realized with this value of hM
        const rMeanderMinRealizable = rL * (hMMin + 2 * this.radius * (Math.PI - 2) + 2 * this.w);

        return rMeanderMin > rMeanderMinRealizable;
    }
}