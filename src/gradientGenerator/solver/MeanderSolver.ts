export class MeanderSolver {
    static computeLength(w: number, radius: number, wMeander: number, hMeander: number, nArcs: number) {
        return radius * (nArcs + 1) * (Math.PI - 4) + hMeander + (wMeander - w) * nArcs;
    }

    static computeNumberOfArcs(lDesired: number, radius: number, w: number, wMeander: number, hMeander: number) {
        return Math.ceil((lDesired + radius * (4 - Math.PI) - hMeander) / (radius * (Math.PI - 4) + wMeander - w));
    }

    static computeNumberOfArcsMax(lDesired: number, radius: number, w: number, wMeander: number) {
        return Math.floor((lDesired + radius * (2 - Math.PI) - 2 * w) / (radius * (Math.PI - 2) + wMeander - w));
    }

    static computeWidthMeander(lDesired: number, radius: number, w: number, hMeander: number, nArcs: number) {
        return (lDesired + radius * (nArcs + 1) * (4 - Math.PI) - hMeander) / nArcs + w;
    }

    static computeHeightMeander(lDesired: number, radius: number, w: number, wMeander: number, nArcs: number) {
        return lDesired + radius * (nArcs + 1) * (4 - Math.PI) - nArcs * (wMeander - w);
    }

    static computeMinimalHeightMeander(lDesired: number, radius: number, w: number, wMeander: number) {
        const nArcs = this.computeNumberOfArcsMax(lDesired, radius, w, wMeander);
        if(nArcs < 1) {
            //wMeander (more precisely wMeanderMax) is too large for a fully stretched arc
            //=> return minimal meander height (the right length can than be realized by recalculating wMeander)
            return 2*w + 4*radius;
        } else {
            return this.computeHeightMeander(lDesired, radius, w, wMeander, nArcs);
        }
    }
}