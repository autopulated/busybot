import t from 'tap';
import { generate } from '../index.mjs';

t.test('invalid exponent', async t => {
    t.plan(2);

    await t.rejects(generate({forMersenneExponent: 1234, withDifficulty: 32}), {}, 'should reject with invalid exponent');

    await t.rejects(generate({forMersenneExponent: 31, withDifficulty: 32}), {}, 'should reject with too small an exponent');

    t.end();
});

t.test('valid exponent', async t => {
    const challenge = await generate({forMersenneExponent: 86243, withDifficulty: 64});

    t.match(challenge, {
        c: String,
        d: 64,
        m: 86243
    }, 'should have expected properties');

    t.end();
});

t.test('small exponent', async t => {
    const challenge = await generate({forMersenneExponent: 89, withDifficulty: 10});

    t.match(challenge, {
        c: String,
        d: 10,
        m: 89
    }, 'should have expected properties');

    t.end();
});

t.test('invalid difficultly', async t => {
    t.plan(4);

    await t.rejects(generate({forMersenneExponent: 2203, withDifficulty: null}), {}, 'should reject with null difficulty');

    await t.rejects(generate({forMersenneExponent: 2203, withDifficulty: 100n}), {}, 'should reject with BigInt difficulty');

    await t.rejects(generate({forMersenneExponent: 2203, withDifficulty: Infinity}), {}, 'should reject with infinite difficulty');

    await t.rejects(generate({forMersenneExponent: 2203, withDifficulty: -1}), {}, 'should reject with negative difficulty');

    t.end();
});
