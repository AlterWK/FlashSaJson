export function parse(arr: number[]) {
    var m = arr;
    var A = m[0];
    var B = m[1];
    var C = m[2];
    var D = m[3];

    if (A * D == B * C) throw new Error('transform#unmatrix: matrix is singular');

    // step (3)
    var scaleX = Math.sqrt(A * A + B * B);
    A /= scaleX;
    B /= scaleX;

    // step (4)
    var skew = A * C + B * D;
    C -= A * skew;
    D -= B * skew;

    // step (5)
    var scaleY = Math.sqrt(C * C + D * D);
    C /= scaleY;
    D /= scaleY;
    skew /= scaleY;

    // step (6)
    if (A * D < B * C) {
        A = -A;
        B = -B;
        skew = -skew;
        scaleX = -scaleX;
    }

    return {
        translateX: m[4],
        translateY: m[5],
        rotate: rtod(Math.atan2(B, A)),
        skew: rtod(Math.atan(skew)),
        scaleX: round(scaleX),
        scaleY: round(scaleY),
    };
}

/**
 * Radians to degrees
 *
 * @param {Number} radians
 * @return {Number} degrees
 * @api private
 */

function rtod(radians) {
    var deg = (radians * 180) / Math.PI;
    return round(deg);
}

/**
 * Round to the nearest hundredth
 *
 * @param {Number} n
 * @return {Number}
 * @api private
 */

function round(n) {
    return Math.round(n * 100) / 100;
}

console.log(parse([0.96, -0.25, 0.25, 0.96, 313, 274]));
