export class ResistanceModel {
    mu: number;
    constructor(mu: number) {
        this.mu = mu;
    }

    computeResistance(w: number, h: number, l: number) {
        return l * ResistanceModel.computeFactorA(w, h) * this.mu / (w * Math.pow(h, 3));
    }

    static computeFactorA(w: number, h: number) {
        return 12 / (1 - 192 * h * Math.tanh(Math.PI * w / (2 * h)) / (Math.pow(Math.PI, 5) * w));
    }
}