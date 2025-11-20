/**
 * Integral computation (slow, high precision)
 */

import * as Environment from '@/logic/environment.js';

export function poly(a) {
  return (
    Environment.getLambda() * Math.pow(a, 4) -
    Environment.getKappa() * a * a +
    Environment.getOmega() * a +
    Environment.getAlpha()
  );
}

export function funcToIntegrate(x) {
  return 1.0 / Math.sqrt(poly(x));
}

/**
 * Numerical integration using fixed step trapezoidal rule
 * @param {number} limitA - start of interval
 * @param {number} limitB - end of interval
 * @param {number} stepH - step size
 * @returns {number}
 */
export function integrate(limitA, limitB, stepH) {
  let sum = 0;

  for (let temp = limitA + stepH; temp < limitB; temp += stepH) {
    sum += funcToIntegrate(temp);
  }

  sum *= stepH;

  return (
    (stepH / 2) * (funcToIntegrate(limitA) + funcToIntegrate(limitB)) +
    sum
  );
}

