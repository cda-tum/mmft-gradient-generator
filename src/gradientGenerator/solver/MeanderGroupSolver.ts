import { MeanderSolver } from "./MeanderSolver";

interface MeanderResult {
    w: number,
    radius: number,
    l: number,
    wMeander: number,
    hMeander: number,
    nArcs: number,
    comment: string
}

export class MeanderGroupSolver {
    wMeanderMax: number;
    meanderDimensions: MeanderResult[] = [];
    private nMeanders: number;

    constructor(w: number, radius: number, wMeanderMax: number, lDesired: number[]) {
        this.wMeanderMax = wMeanderMax;
        this.nMeanders = lDesired.length;
        for (let i = 0; i < this.nMeanders; i++) {
            this.meanderDimensions.push(
                {
                    w: w,
                    radius: radius,
                    l: lDesired[i],
                    wMeander: 0,
                    hMeander: 0,
                    nArcs: 0,
                    comment: ''
                }
            )
        }
    }

    solve(): boolean {
        //find index for longest meander
        let longest: MeanderResult | undefined;
        for (const meander of this.meanderDimensions) {
            if (longest === undefined || meander.l > longest.l) {
                longest = meander;
            }
        }

        if (!longest) {
            return false;
        }

        //the longest meander determines the height of the meander area (hMeander)
        //if possible, the longest meander utilizes the maximal width of the meander area (wMeanderMax)
        //this results in the minimal value for hMeander
        //the equation can be derived as follows:
        // (1) length of meander: l = hMeander + nArcs * (wMeander - w + radius * (Math.Pi - 4)) + radius * (Math.Pi - 4)
        // (2) constraint for height: hMeander >= 2 * w + 2 * radius * (nArcs + 1)
        //now rearrange (1) to hMeander, insert it into (2) and rearrange to nArcs
        //by only allowing integer values for the inequality the number of arcs for the longest meander can be computed 
        longest.nArcs = MeanderSolver.computeNumberOfArcsMax(longest.l, longest.radius, longest.w, this.wMeanderMax);

        if (longest.nArcs < 1) {
            //nArcs[iLong] < 1 indicates that wMeanderMax is too large in order to realize the desired length
            //in this case just set nArcs[iLong] = 1, hMeander = 2 * w + 4 * radius and recalculate a corresponding wMeander (which i smaller than wMeanderMax)
            longest.nArcs = 1;
            longest.hMeander = 2 * longest.w + 4 * longest.radius;
            longest.wMeander = MeanderSolver.computeWidthMeander(longest.l, longest.radius, longest.w, longest.hMeander, longest.nArcs);
        } else {
            //nArcs[iLong] >= 1 indicates that the desired length can be realized with wMeanderMax
            //thus, set wMeander for the longest meander accordingly
            longest.wMeander = this.wMeanderMax;

            //this allows to determine hMeander now (which is identically for all other meanders)
            longest.hMeander = MeanderSolver.computeHeightMeander(longest.l, longest.radius, longest.w, longest.wMeander, longest.nArcs);
        }

        //compute values for all other meanders
        for (const meander of this.meanderDimensions) {
            //do not consider longest since this meander is already fully specified  
            if (longest === meander) {
                continue;
            }

            //set hMeander accordingly
            meander.hMeander = longest.hMeander;

            //compute nArcs
            meander.nArcs = MeanderSolver.computeNumberOfArcs(meander.l, meander.radius, meander.w, this.wMeanderMax, meander.hMeander);

            //if nArcs < 1 then no valid solution can be found
            if (meander.nArcs < 1) {
                meander.nArcs = 0;
                continue;
            }

            //nArcs[i] cannot be greater than nArcs[iLong] (which should only happen in corner cases)
            if (meander.nArcs > longest.nArcs) {
                meander.nArcs = longest.nArcs;
            }

            //recompute wMeander
            meander.wMeander = MeanderSolver.computeWidthMeander(meander.l, meander.radius, meander.w, meander.hMeander, meander.nArcs);
        }

        //check constraints for all meanders. if even a single meander does not satisfy its constraint then no valid result can be achieved
        let solvable = true;
        for (const meander of this.meanderDimensions) {
            if (!MeanderGroupSolver.checkMeanderConstraints(meander)) {
                solvable = false;
            }
        }

        return solvable;
    }

    // static checkMeanderConstraints(meander: { w: number, radius: number, wMeander: number, hMeander: number, nArcs: number }): boolean {
    static checkMeanderConstraints(meander: MeanderResult): boolean {
        if (meander.w <= 0) {
            meander.comment = 'w <= 0';
            return false;
        }

        if (meander.radius <= 0) {
            meander.comment = 'radius <= 0';
            return false;
        }

        if (meander.radius < meander.w) {
            meander.comment = 'radius < w';
            return false;
        }

        if (meander.nArcs < 1) {
            meander.comment = 'nArcs < 1';
            return false;
        }

        //compute temporary values
        const l0 = 0.5 * meander.hMeander - meander.radius * (meander.nArcs + 1);
        // const l1 = meander.wMeander - 2 * meander.radius - meander.w;
        const l2 = 0.5 * (meander.wMeander - meander.w) - 2 * meander.radius;
        // console.log(`l0 = ${l0}, l2=${l2}`);


        if (l0 < meander.w) {
            meander.comment = 'l0 < w';
            return false;
        }

        if (l2 < meander.w) {
            meander.comment = 'l2 < w';
            return false;
        }

        meander.comment = '';
        return true;
    }
}

// let solver = new MeanderGroupSolver(300e-6, 300e-6, 5000e-6, [10000e-6, 9500e-6, 30000e-6, 30000e-6, 15000e-6]);
// solver.solve();

// console.log(solver);

// for (const meander of solver.meanderDimensions) {
//     console.log(MeanderSolver.computeLength(meander.w, meander.radius, meander.wMeander, meander.hMeander, meander.nArcs));
// }

// let w = 300e-6;
// let r = w;
// let wMeander = (Math.PI + 9) * w;


// console.log(MeanderSolver.computeLength(w, r, wMeander, 20 * w, 1));
// console.log(MeanderSolver.computeLength(w, r, 3 * w + 4 * r, 20 * w, 2));
// console.log(MeanderSolver.computeLength(w, r, wMeander, 20 * w, 2));
// console.log(MeanderSolver.computeLength(w, r, 3 * w + 4 * r, 20 * w, 3));


// let jjkl: number[][] = [];
// jjkl.push([1, 2, 3, 5]);
// jjkl.push([1, 2, 3]);
// jjkl.push([1, 2, 3, 4, 5, 6, 7, 8, 9]);
// console.log(jjkl);
// console.log(jjkl[0][3]);
// console.log(jjkl[0][4]);
