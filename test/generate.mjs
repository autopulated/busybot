import t from 'tap';
import { generate } from '../index.mjs';

t.test('invalid exponent', async t => {
    await t.rejects(generate({forMersenneExponent: 1234, withDifficulty: 32}), {}, 'should reject with invalid exponent');

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
