import t from 'tap';
import { generate, solve, verify, initMathsFunctions } from '../index.mjs';

t.test('modular arithmetic basics', async t => {

    const {
        modulus,
        exponent,

        barrettMul,
        barrettFastSquare,

        fastModPow,
        fastFixedExpPow
    } = initMathsFunctions({forMersenneExponent: 17});

    t.equal(modulus, 2n**17n - 1n, 'modulus should be 2^forMersenneExponent - 1');
    t.equal((123n * 121n) % modulus, barrettMul(123n, 121n), 'barrettMul result should match naiive implementation');
    t.equal((123n * 123n) % modulus, barrettFastSquare(123n), 'barrettFastSquare result should match naiive implementation');

    t.equal((123n ** exponent) % modulus, fastModPow(123n), 'fastModPow result should match naiive implementation');
    t.equal((123n ** exponent) % modulus, fastFixedExpPow(123n), 'fastFixedExpPow result should match naiive implementation');


    const challenge = await generate({forMersenneExponent: 1279, withDifficulty: 32});
    const solution = solve(challenge);
    const verified = verify(challenge, solution);
    t.ok(verified, 'basic round-trip test');
    t.end();
});

t.test('round trip', async t => {
    const challenge = await generate({forMersenneExponent: 1279, withDifficulty: 32});
    const solution = solve(challenge);
    const verified = verify(challenge, solution);
    t.ok(verified, 'basic round-trip test');
    t.end();
});
