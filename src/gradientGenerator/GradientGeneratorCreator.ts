import { convertToSVG } from "./mesh/Converter";
import { GradientGenerator } from "./architecture/GradientGenerator";
import { GradientGeneratorSolver } from "./solver/GradientGeneratorSolver";
import { MeanderGroupSolver } from "./solver/MeanderGroupSolver";

export class GradientGeneratorCreator {
    w = 0;
    h = 0;
    radius = 0;
    wMeanderMax = 0;
    mu = 0;
    tMin = 0;
    straightOutlets = true;
    inlets: { c: number, q: number, l: number }[] = [];
    outlets: { c: number, q: number, r: number }[] = [];
    error = { id: '', message: '' };
    private gradientGenerator: GradientGenerator | undefined;

    constructor() { }

    getTotalHeight(): number {
        if (this.gradientGenerator) {
            const lInletMax = this.inlets[0].l > this.inlets[1].l ? this.inlets[0].l : this.inlets[1].l;

            let hMeandersSum = 0;
            for (const meanderLayer of this.gradientGenerator.meanders) {
                hMeandersSum += meanderLayer[0].hMeander;
            }

            return lInletMax + hMeandersSum;
        }

        return 0;
    }

    getTotalWidth(): number {
        if (this.gradientGenerator) {
            const nOutlets = this.outlets.length;
            const lConnection = (this.wMeanderMax + this.w) / 2;

            return 2 * nOutlets * lConnection;
        }

        return 0;
    }

    areParametersValid(): boolean {
        let result = this.checkParameters();

        this.error.id = result.id;
        this.error.message = result.message;

        return !result.error;
    }

    private checkParameters(): { error: boolean, id: string, message: string } {
        //w
        if (!(0 < this.w)) return { error: true, id: 'width', message: 'Parameter Error: "0 < w" must hold' };

        //h
        if (!(0 < this.h && this.h <= this.w)) return { error: true, id: 'height', message: 'Parameter Error: "0 < h <= w" must hold' };

        //radius
        if (!(this.w <= this.radius)) return { error: true, id: 'radius', message: 'Parameter Error: "w <= radius" must hold' };

        //wMeanderMax
        if (!(5 * this.w + 8 * this.radius < this.wMeanderMax)) return { error: true, id: 'wMeanderMax', message: 'Parameter Error: "5*w+ 8*r < wMeanderMax" must hold' };

        //mu
        if (!(0 < this.mu)) return { error: true, id: 'mu', message: 'Parameter Error: "0 < µ" must hold' };

        //tMin
        if (!(0 < this.tMin)) return { error: true, id: 'tMin', message: 'Parameter Error: "0 < tMin" must hold' };

        //inlets.length
        if (!(this.inlets.length === 2)) return { error: true, id: 'inlets.length', message: 'Parameter Error: "nInlets = 2" must hold, where "nInlets" is the number of inlets' };

        //inlets
        let qInletSum = 0; //compute sum(qInlet[i]) for later
        for (let iInlet = 0; iInlet < this.inlets.length; iInlet++) {
            const inlet = this.inlets[iInlet];

            //c
            if (!(0 <= inlet.c && inlet.c <= 1)) return { error: true, id: `inlet-${iInlet}-c`, message: `Parameter Error at ${iInlet + 1}.Inlet: "0% <= c <= 100%" must hold` };

            //q
            if (!(0 < inlet.q)) return { error: true, id: `inlet-${iInlet}-q`, message: `Parameter Error at ${iInlet + 1}.Inlet: "0 < q" must hold` };
            qInletSum += inlet.q;

            //l
            if (!(this.w <= inlet.l)) return { error: true, id: `inlet-${iInlet}-l`, message: `Parameter Error at ${iInlet + 1}.Inlet: "w <= l" must hold` };
        }
        //cInlet[i] > cInlet[i+1]
        for (let iInlet = 0; iInlet < this.inlets.length - 1; iInlet++) {
            const cInlet0 = this.inlets[iInlet].c;
            const cInlet1 = this.inlets[iInlet + 1].c;
            if (!(cInlet0 > cInlet1)) return { error: true, id: `inlets-c`, message: `Parameter Error at Inlets: "cInlet${iInlet + 1} > cInlet${iInlet + 2}" must hold` };
        }

        //outlets.length
        if (!(this.outlets.length >= 3)) return { error: true, id: 'inlets.length', message: 'Parameter Error: "nOutlets >= 3" must hold, where "nOutlets" is the number of outlets' };

        //outlets
        let qOutletSum = 0; //compute sum(qOutlet[i]) for later
        for (let iOutlet = 0; iOutlet < this.outlets.length; iOutlet++) {
            const outlet = this.outlets[iOutlet];

            //do not check c and q for first and last outlet
            if (iOutlet !== 0 && iOutlet !== this.outlets.length - 1) {
                //c
                if (!(0 <= outlet.c && outlet.c <= 1)) return { error: true, id: `outlet-${iOutlet}-c`, message: `Parameter Error at ${iOutlet + 1}.Inlet: "0% <= c <= 100%" must hold` };

                //q
                if (!(0 < outlet.q)) return { error: true, id: `outlet-${iOutlet}-q`, message: `Parameter Error at ${iOutlet + 1}.Inlet: "0 < q" must hold` };
                qOutletSum += outlet.q;
            }

            //r
            if (!(0 <= outlet.r)) return { error: true, id: `outlet-${iOutlet}-r`, message: `Parameter Error at ${iOutlet + 1}.Inlet: "0 <= r" must hold` };
        }
        //cOutlet[i] > cOutlet[i+1]
        for (let iOutlet = 0; iOutlet < this.outlets.length - 1; iOutlet++) {
            const cOutlet0 = this.outlets[iOutlet].c;
            const cOutlet1 = this.outlets[iOutlet + 1].c;
            if (!(cOutlet0 > cOutlet1)) return { error: true, id: `outlets-c`, message: `Parameter Error at Outlets: "cOutlet${iOutlet + 1} > cOutlet${iOutlet + 2}" must hold` };
        }

        //sum(qOutlet[i]) < sum(qInlet[i])
        if (!(qOutletSum < qInletSum)) return { error: true, id: `outlets-q`, message: `Parameter Error at Outlets: "sum(qOutlet[i]) < sum(qInlet[i])" must hold` };

        return { error: false, id: '', message: 'All parameters are valid' };
    }

    createGradientGenerator(): boolean {
        const lConnection = (this.wMeanderMax + this.w) / 2;
        const nInlets = this.inlets.length;
        const nOutlets = this.outlets.length;

        //set parameters for gradient generator solver
        const gradientSolver = new GradientGeneratorSolver(nOutlets, this.w, this.h, this.radius, lConnection, this.mu, this.tMin);

        //inlet parameters
        for (let iInlet = 0; iInlet < nInlets; iInlet++) {
            const inletCreator = this.inlets[iInlet];
            const inletSolver = gradientSolver.inlets[iInlet];
            inletSolver.c = inletCreator.c / 100;
            inletSolver.q = inletCreator.q;
            inletSolver.l = inletCreator.l;
        }

        //outlet parameters
        for (let iOutlet = 0; iOutlet < nOutlets; iOutlet++) {
            const outletCreator = this.outlets[iOutlet];
            const outletSolver = gradientSolver.outlets[iOutlet];

            outletSolver.c = outletCreator.c / 100;
            outletSolver.l = outletCreator.r / gradientSolver.rModel.computeResistance(this.w, this.w, 1.0);
            outletSolver.q = outletCreator.q;
        }
        let solvable = gradientSolver.solve();
        if (!solvable) {
            this.error.id = gradientSolver.error.id;
            this.error.message = 'Calculation Error: ' + gradientSolver.error.message;
            return false;
        }

        //solve meander channels (basically hMeander and nArcs for all meanders)
        const meanderGroupSolvers: MeanderGroupSolver[] = [];
        solvable = true;
        for (let iLayer = 0; iLayer < gradientSolver.nLayers; iLayer++) {
            const meanders = gradientSolver.meanders[iLayer];
            const lDesired: number[] = [];
            for (let iMeander = 0; iMeander < meanders.length; iMeander++) {
                lDesired.push(meanders[iMeander].l);
            }
            const meanderGroupSolver = new MeanderGroupSolver(this.w, this.radius, this.wMeanderMax, lDesired);
            meanderGroupSolvers.push(meanderGroupSolver);
            if (!meanderGroupSolver.solve()) {
                solvable = false;
                // console.log(`Not solvable (iLayer=${iLayer})!`);
                // console.log(meanderGroupSolver.meanderDimensions);
            }
            // console.log(`iLayer=${iLayer}: wMeanderMax=${meanderGroupSolver.wMeanderMax}, hMeander=${meanderGroupSolver.meanderDimensions[0].hMeander}`);
            // for (let iMeander = 0; iMeander < meanderGroupSolver.meanderDimensions.length; iMeander++) {
            //     const meander = meanderGroupSolver.meanderDimensions[iMeander];
            //     console.log(`   iMeander=${iMeander}: q=${meander.nArcs}, l=${meander.l.toExponential(6)}, wMeander=${meander.wMeander}`);
            // }
        }
        if (!solvable) {
            this.error.id = 'meanderGroup';
            this.error.message = 'Calculation Error: Cannot find valid geometrical parameters for all meanders'
            return false;
        }

        //gradient generator
        this.gradientGenerator = new GradientGenerator(nOutlets, this.w, this.radius, lConnection);

        //set parameters accordingly
        //inlets
        for (let iInlet = 0; iInlet < this.gradientGenerator.nInlets; iInlet++) {
            this.gradientGenerator.inlets[iInlet].l = this.inlets[iInlet].l;
        }
        //meanders
        for (let iLayer = 0; iLayer < this.gradientGenerator.nLayers; iLayer++) {
            const meanderGroup = meanderGroupSolvers[iLayer];
            for (let iMeander = 0; iMeander < meanderGroup.meanderDimensions.length; iMeander++) {
                this.gradientGenerator.meanders[iLayer][iMeander].setDimensions(meanderGroup.meanderDimensions[iMeander]);
            }
        }
        //outlets
        for (let iOutlet = 0; iOutlet < this.gradientGenerator.nOutlets; iOutlet++) {
            this.gradientGenerator.outlets[iOutlet].l = this.outlets[iOutlet].r / gradientSolver.rModel.computeResistance(this.w, this.w, 1.0);
        }

        //create
        this.gradientGenerator.createGradientGenerator();

        return true;
    }

    createSVGPath() {
        if (this.gradientGenerator) {
            let quads = this.gradientGenerator.getQuads();

            return convertToSVG(quads);
        }

        return '';
    }
}




// let lInlet = 10 * w;
// let lConnection = (wMeanderMax - w) / 2;
// let lOutlet = 10 * w;
// let qInlet = 1e-13;

// for (let iInlet = 0; iInlet < 2; iInlet++) {
//     const inlet = gradientSolver.inlets[iInlet];
//     inlet.c = 1.0 - iInlet;
//     inlet.l = lInlet;
//     inlet.q = qInlet;
// }

// for (let iOutlet = 0; iOutlet < nOutlets; iOutlet++) {
//     const outlet = gradientSolver.outlets[iOutlet];
//     outlet.l = lOutlet;
//     outlet.q = 2 * qInlet / nOutlets;

//     if (iOutlet === 0) {
//         outlet.c = 1.0;
//     } else if (iOutlet === nOutlets - 1) {
//         outlet.c = 0.0;
//     } else {
//         outlet.c = concentrations[iOutlet - 1];
//     }
// }
// console.log(gradientSolver.inlets);
// // console.log(gradient.outlets);

// console.log('Start solveQ');
// gradientSolver.solve();
// console.log(gradientSolver.meanders);
// console.log('End solveQ');
// console.log(gradient.connections);
// console.log('Start solveQ2');
// gradient.solve2();
// console.log('End solveQ2');
// console.log(gradient.inlets);
// console.log(gradient.meanders);
// console.log(gradient.connections);


