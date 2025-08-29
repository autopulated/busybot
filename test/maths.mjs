import t from 'tap';
import { initMathsFunctions } from '../index.mjs';


// test (for a small modulus) that our math implementations work for all numbers in the group, and for 0
t.test('exhaustive, n=13', t => {

    const {
        modulus,
        exponent,

        barrettMul,
        barrettFastSquare,

        fastModPow,
        fastFixedExpPow
    } = initMathsFunctions({forMersenneExponent: 13});

    // tap struggles a bit if all of these are explicit tests, so just produce
    // real tests for failures:
    let ok = true;
    for(let i = 0n; i < modulus; i++) {
        if ((i * (i-1n)) % modulus !==  barrettMul(i, i-1n)) {
            t.fail(`barrettMul(${i}, ${i-1n})`);
        }
        if ((i * i) % modulus !== barrettFastSquare(i)) {
            t.fail(`barrettFastSquare(${i})`);
        }
        if ((i ** exponent) % modulus !== fastModPow(i)) {
            t.fail(`fastModPow(${i}) result should match naiive implementation`);
        }
        if ((i ** exponent) % modulus !== fastFixedExpPow(i)) {
            t.fail(`fastFixedExpPow(${i}) result should match naiive implementation`);
        }
    }

    t.ok(ok, 'exhaustive maths tests did not pass');
    t.end();

});

t.test('initMathsFunctions', t => {

    t.throws(() => {initMathsFunctions({forMersenneExponent:'foo'});}, {}, 'should throw for invalid argument');
    t.throws(() => {initMathsFunctions({forMersenneExponent:67});}, {}, 'should throw for non-mersenne primes');
    t.throws(() => {initMathsFunctions({forMersenneExponent:257});}, {}, 'should throw for non-mersenne primes');


    t.end();
});

t.test('fastModPow out of range values', t => {

    const {
        modulus,
        fastModPow,
    } = initMathsFunctions({forMersenneExponent: 607});

    t.throws(() => {fastModPow(-1n);}, {}, 'should throw for negative argument');
    t.throws(() => {fastModPow(modulus);}, {}, 'should throw for out of range argument');
    t.throws(() => {fastModPow(123);}, {}, 'should throw for not-a-bigint argument');

    t.end();
});
