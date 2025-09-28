//  Copyright 2025 http://github.com/autopulated
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

// Busybot. An implementation of the proof of work scheme used by kCTF
// (https://github.com/google/kctf/blob/v1/docker-images/challenge/pow.py), to
// impose expensive work on pesky bots before serving their requests.
//
// This implementation is pure js, with no run-time dependencies, and
// compatible with any browser or js environment with BigInt support
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)
//
// We have a modulus m, which is a Mersenne prime (2^n -1) (kCTF uses n=1279.
// but the ratio of difficulty of solving the challenge vs verifying it is
// directly correlated to n)
//
// The challenge is for the client to perform a series of modular square roots
// on some random value, provided by the server, flipping a bit between each
// multiplication to prevent trivial shortcuts.
//
// For the server to verify the challenge, it will square the result, flipping
// the same bits between each step, and check if it gets back to the correct
// initial value. Squaring is much faster to calculate than the square root (in
// this implementation, about 3000x for n=3217).
//
// Since Mersenne primes have remainder 3 mod 4, the square root step consists
// of the calculation, x ^ ((m + 1)/4), from
// https://en.wikipedia.org/wiki/Tonelli–Shanks_algorithm.
//
// It is worth mentioning that only half of the numbers between 0 and m have a
// square root, but this scheme applies the calculation x ^ ((m + 1)/4)
// indiscriminately to any number. If some x does not in fact have a square
// root, then the result of squaring the result is instead, -x (mod m). So even
// after any number of operations, we can only be out by a factor of -1 (this
// is why the verify step checks the final result against -x as well as x.)
//
// For the squaring step in the verification, since a Mersenne prime is a
// simple sum of 2^n - 2^0, the Barrett reduction of the square operation is
// very cheap, consisting only of a few adds and shifts.
//
//
// This proof of work scheme is useful over a hash-collision type scheme
// because it is resistant to parallel implantation, not memory intensive, and
// predictable in duration largely varying only by single core processing
// speed, and the speed of the closest few KB of cache. A client with
// significant parallel GPU compute cannot calculate a challenge dramatically
// faster or cheaper than a client with a single core processor.
// (And these reasons appear to be why it was chosen for kCTF
// https://github.com/google/kctf/commit/b770fad71304cb060475c98bcabd2e150d217ad0)
//
// This scheme does of course cause all clients to 'waste' time and energy,
// it's suggested to impose it only on a high rate of requests from a single ip
// address, where it can avoid otherwise denying service to genuine users who
// are sharing a connection: a group of 100 students in a school sharing the
// same ip address are not significantly hampered by each having to wait 10
// seconds for an important request, but a single abusive client making 100
// requests would have to spend 15 minutes of computing time for the privilege.


// from https://oeis.org/A000043
const Known_Mersenne_Exponents = [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127,
    521, 607, 1279, 2203, 2281, 3217, 4253, 4423, 9689, 9941, 11213, 19937,
    21701, 23209, 44497, 86243, 110503, 132049, 216091, 756839, 859433,
    1257787, 1398269, 2976221, 3021377, 6972593, 13466917, 20996011, 24036583,
    25964951, 30402457, 32582657, 37156667, 42643801, 43112609, 57885161,
    74207281];

function isMersenneExponent(n) {
    return Known_Mersenne_Exponents.includes(Number(n));
}

// The challenge works with any pattern of bits flipped between each iteration,
// but the kCTF version flips only the lsb, and I can't see any reason to do
// otherwise.
const Flip_Bits = 1n;

// pre-calculate a number of constants based on the base we're working in, and
// return various functions to do modular arithmetic in this base.
function initMathsFunctions({forMersenneExponent}) {
    // check that the chosen exponent is indeed a Mersenne prime:
    if (typeof forMersenneExponent !== 'number') {
        forMersenneExponent = Number(forMersenneExponent);
    }
    if (!isMersenneExponent(forMersenneExponent)) {
        throw new Error(`"${forMersenneExponent}" is not known to be a Mersenne exponent, expected one of: ${Known_Mersenne_Exponents}`);
    }

    // the modulus we're working in
    const modulusLog2 = BigInt(forMersenneExponent);
    const modulus = (1n << modulusLog2) - 1n;

    // exponent required to calculate the square root
    const exponent = (modulus + 1n) / 4n;
    const exponentLog2 = Number(modulusLog2) - 2;


    // Calculate modulus of a * b by Barrett reduction:
    // constants used by Barrett Reduction:
    // https://link.springer.com/chapter/10.1007/3-540-47721-7_24
    const barrett_n = modulusLog2;
    const barrett_R = (1n << (2n*barrett_n)) / modulus;

    // this basic Barrett multiplication implementation is not used, but it is
    // useful to understand the faster version below.
    const barrettMul = function(a, b) {
        const w = a * b;
        const x2 = (w >> (barrett_n - 1n)) * barrett_R;
        const x3 = x2 >> (barrett_n + 1n);
        let x = w - (x3 * modulus);
        if (x >= modulus) {
            x -= modulus;
        }
        return x;
    };

    // since we're using a Mersenne prime as modulus, the Barrett multiplication
    // can be simplified further, by noticing that barrett_R is of the form
    // 2^barrett_n + 1, and that modulus is 2^n -1, and multiplying by 2^n is
    // just a bit-shift by n bits.
    // if ((1n << barrett_n) + 1n !== barrett_R) {
    //     throw new Error('emath');
    // }
    // if ((1n << modulusLog2) - 1n !== modulus) {
    //     throw new Error('emath');
    // }
    const barrettFastSquare = function(a) {
        const w = a * a;
        const x2 = (w >> (barrett_n - 1n));
        // multiply x2 by barrett_R, taking advantage of the fact it's 1 + 2^barrett_n:
        const x2m = (x2 << barrett_n) + x2;
        const x3 = x2m >> (barrett_n + 1n);
        // and multiply x3 by modulus, taking advantage of the fact modulus is 2^(modulusLog2+1) -1:
        let x = w - ((x3 << modulusLog2) - x3);
        if (x >= modulus) {
            x -= modulus;
        }
        return x;
    };

    // fast modular power (raising base ^ constant exponent) which makes
    // assumptions to avoid unnecessary operations
    //
    // This is the classic right-to-left binary method
    // (https://en.wikipedia.org/wiki/Modular_exponentiation#Right-to-left_binary_method),
    // but with the multiplication and squaring operations replaced by
    // Barrett-reduction versions, it's 3-4x faster than a naïve implementation
    // of right-to-left binary.
    //
    // (It's relatively important that we use a fast-as-possible implementation
    // in the client to solve the proof of work, so that malicious clients
    // can't benefit from a faster re-implementation that means they do less
    // work than bona fide clients)
    const fastModPow = function(base) {
        // base %= modulus;
        if ((base >= modulus) || (base < 0n)) {
            throw new Error('base must be pre-divided by modulus');
        }

        let result = 1n;

        let e = exponent;
        while (e > 0n) {
            if (e & 1n) {
                // result = (result * base) % modulus;
                result = barrettMul(result, base);
            }
            e >>= 1n;
            // base = (base ** 2n) % modulus;
            base = barrettFastSquare(base);
        }

        return result;
    };

    // given that exponent is fixed, and is an even power of 2, exponentiation
    // by squaring can be reduced to squaring N times:
    // (This is not dramatically faster than fastModPow, since the number of
    // expensive multiplications ends up being the same, but it shows directly
    // how the 'solve' operation is approximately N times more difficult than
    // the verify operation, for a base of N bits, since solving must do these
    // n squaring 'difficulty' times, whereas verifying must just square once
    // 'difficulty' times.)
    const fastFixedExpPow = function(base) {
        let n = exponentLog2;
        while (n > 0) {
            base = barrettFastSquare(base);
            n -= 1;
        }
        return base;
    };


    return {
        modulus,
        exponent,

        barrettMul,
        barrettFastSquare,

        fastModPow,
        fastFixedExpPow
    };
}


let randomBytesP;
// generate a (json-encoded) challenge. The encoding format is JSON, not the same format used by kCTF.
async function generate({forMersenneExponent = 1279, withDifficulty}){
    // challenge generation is only supported in a node environment
    if (!randomBytesP) {
        randomBytesP = (await import(/* webpackIgnore: true */ 'node:util')).promisify((await import(/* webpackIgnore: true */ 'node:crypto')).randomBytes);
    }

    if (!isMersenneExponent(forMersenneExponent)) {
        throw new Error(`"${forMersenneExponent}" is not known to be a Mersenne exponent, expected one of: ${Known_Mersenne_Exponents}`);
    }
    if (forMersenneExponent < 61) {
        throw new Error(`"${forMersenneExponent}" is too small of a base to produce a secure challenge.`);
    }

    if ((!Number.isSafeInteger(withDifficulty)) || withDifficulty < 0) {
        throw new Error('Difficulty must be a positive integer.');
    }

    const challengeByteLength = (forMersenneExponent < 128)? Math.floor(forMersenneExponent/8) : 16;

    return {
        c: `0x${(await randomBytesP(challengeByteLength)).toString('hex')}`,
        d: withDifficulty,
        m: forMersenneExponent
    };
}


// solve a challenge of the form:
// {
//   c: '0xabc123......', (hex-encoded BigInt random challenge value)
//   d: 100, (integer, number of iterations of modular square root to calculate)
//   m: 3217, (a Mersenne prime exponent, of the Mersenne prime base to use for modular arithmetic)
// }
// returning a solution of the form:
// {
//   s: '0xfe173.....' (hex-encoded BigInt, challenge value after d modular square roots, followed by bit flips)
// }
// Throws if challenge is invalid.
function solve(challenge, {progressCallback}={}) {
    if ((!challenge) ||
        (typeof challenge) !== 'object' ||
        (typeof challenge.c) !== 'string' ||
        (typeof challenge.d) !== 'number' ||
        (typeof challenge.m) !== 'number') {
        throw new Error('Malformed challenge: must have .c, .m, and .d');
    }
    if (progressCallback && (typeof progressCallback) !== 'function') {
        throw new Error('progressCallback must be a function');
    }
    let solution = BigInt(challenge.c);
    const difficulty = challenge.d;
    const forMersenneExponent = challenge.m;
    const { fastFixedExpPow, modulus } = initMathsFunctions({ forMersenneExponent });

    if (solution > modulus || solution < 0n) {
        throw new Error('Malformed challenge: out of range for exponent.');
    }

    for (let i = 0; i < difficulty; i++) {
        solution = fastFixedExpPow(solution);
        solution ^= Flip_Bits;
        if (progressCallback){
            progressCallback((i+1) / difficulty);
        }
    }
    return {s: `0x${solution.toString(16)}`};
}

// verify a solution of the form:
// {
//   s: '0xfe173...' (hex-encoded BigInt solution to be verified)
// }
// against a challenge of the same form accepted by solve(), and generated by generate().
// Returns true if the solution is correct, false otherwise. Throws for invalid arguments.
function verify(challenge, solution) {
    if ((!challenge) ||
        (typeof challenge) !== 'object' ||
        (typeof challenge.c) !== 'string' ||
        (typeof challenge.d) !== 'number' ||
        (typeof challenge.m) !== 'number') {
        throw new Error('Malformed challenge: must have .c, .m, and .d');
    }
    if ((!solution) ||
        (typeof solution !== 'object') ||
        (typeof solution.s) !== 'string' ||
        !/^0x[0-9a-fA-F]+$/.exec(solution.s)) {
        throw new Error('Malformed solution: must have .s: hex-encoded BigInt');
    }
    let check = BigInt(solution.s);
    const difficulty = challenge.d;
    const forMersenneExponent = challenge.m;
    const { barrettFastSquare, modulus } = initMathsFunctions({ forMersenneExponent });

    // a malicious client could try to supply out of range values
    if (check >= modulus || check < 0n) {
        return false;
    }

    for (let i = 0; i < difficulty; i++) {
        check = barrettFastSquare(check ^ Flip_Bits);
    }

    const decodedChallange = BigInt(challenge.c);
    if (check === decodedChallange) {
        return true;
    } else if (check === (modulus - decodedChallange)){
        return true;
    }
    return false;
}


const api = {
    generate,
    solve,
    verify,
};

export { generate, solve, verify, initMathsFunctions };

export default api;
