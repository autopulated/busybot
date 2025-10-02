# Busybot: A non-parallelisable cryptographic proof of work scheme
***slow down pesky bots, with no runtime dependencies***

[![CI](https://github.com/autopulated/busybot/actions/workflows/test.yml/badge.svg)](https://github.com/autopulated/busybot/actions/workflows/test.yml)
[![Coverage](https://coveralls.io/repos/github/autopulated/busybot/badge.svg?branch=main)](https://coveralls.io/github/autopulated/busybot?branch=main)
[![NPM Version](https://img.shields.io/npm/v/busybot)](https://www.npmjs.com/package/busybot)

Busybot is a flexible proof of work challenge, that can be used to require
clients to expend time and energy solving a hard cryptographic problem before
accepting their requests. The solution to the challenge can be quickly and
easily verified.

This can be used to protect expensive server functions from overloading by
bots, by imposing a real cost on the bots prior to making the requests.

The challenge cannot be parallelised, or solved dramatically faster on a GPU or
specialist hardware than on a normal CPU.

It is serially compute bound (not memory intensive), and busybot includes
optimised implementations of to both solve and verify challenges in pure JS
with no dependencies.

## Usage:
```npm install --save busybot```

On the server (e.g. [express](https://expressjs.com) or [fastify](https://fastify.dev) app):
```js
import { generate, verify } from 'busybot';
import express from 'express';
import session from 'express-session';

const app = express();
app.use(session({secret:'changeme'}));
app.use(express.json());

// an endpoint for clients to fetch a fresh challenge:
app.get('/get/a/challenge', async function(req, res) {

    // generating a challenge is asynchronous: it might have to wait for
    // the crypto randomBytes API to have enough entropy:
    const challenge = await generate({forMersenneExponent:4253, withDifficulty: 100});
    req.session.challenge = challenge;

    // the challenge is a plain object that is json-serialisable:
    res.send(challenge);
});

// an endpoint protected by the challenge
app.post('/your/expensive/endpoint', function(req, res, next) {
    if ((!req.session.challenge) || !verify(req.session.challenge, req.body.solution)) {
        res.status(401);
        res.send('you must solve the challenge to call this endpoint');
    } else {
        // prevent re-using the challenge (assuming your session is resistant to replay)
        delete req.session.challenge;
        // all good, proceed do do expensive work here...
        res.send('well done, you did the work :)');
    }
});

app.listen(3000, () => { console.log(`Busybot example listening on :3000`) })
```

On the client, solve it:
```js
import { solve } from 'busybot';

// receive the challenge from the server however you like, e.g.
const challenge = (await (await fetch('locahost:3000/get/a/challenge')).json());

// solve it: this will take several seconds depending on the specified
// difficulty. If you're doing this in a web page you might want to use a Web
// Worker
const solution = solve(challenge);

// make the expensive request that requires the challenge
const expensiveResult = await fetch('/your/expensive/endpoint',
    {
        method: 'POST',
        headers: {"Content-Type": "application/json" },
        body: JSON.stringify({solution})
    }
);
```

## API

### `async busybot.generate({forMersenneExponent = 1279, withDifficulty})`
Generate a challenge (returned as a promise to a plain object that can be
safely JSON-serialised). Throws for invalid arguments.

Note that this returns a promise because it may be necessary for the system
crypto api to wait until it has enough entropy to generate a secure random
value.

`withDifficulty` is a number that linearly scales the difficulty of the
challenge. 

`forMersenneExponent` should be the exponent of a Mersenne prime, that scales
the difficultly of the challenge much more dramatically. Sensible values are:
 * `61, 89, 107, 127, 521, 607`: **very easy challenges** taking milliseconds at difficulty 100
 * `1279, 2203, 2281, 3217, 4253, 4423`: **normal** challenges taking seconds at difficulty 100
 * `9689, 9941, 11213, 19937, 21701, 23209`: **very difficult** challenges taking 10s to minutes at difficultly 100

Examples:
```js
import {generate} from 'busybot';
// using the default exponent of 1279:
const challenge1 = await generate({withDifficulty:100});

// challenge 2 is 10 times more difficult than challenge 1:
const challenge2 = await generate({withDifficulty:1000});

// challenge 3 is very difficult (approx 200x more) because it 
// uses a large exponent, despite the same difficulty.
const challenge3 = await generate({
    forMersenneExponent: 11213,
    withDifficulty: 100
});
```

### `busybot.solve(challenge, {progressCallback})`
Solve a challenge (as returned from `.generate()`. The solution is returned as
a plain object that can be safely JSON-serialised. Throws for invalid
challenges (but it is possible to construct a valid challenge that will not
complete in a reasonable amount of time, and no attempt is made to protect
against this).

If provided, `progressCallback` is called after each iteration with the current completion (from 0 to 1):

```js
const solution = solve(challenge, {
    progressCallback: (p) => console.log(`${p*100}% complete.`)
});
```

Note that solve is synchronous, and will block until the challenge is completed.


### `busybot.verify(challenge, solution)`
Verify a solution (as returned from `.solve()`). Returns `true` for correct
solutions, `false` for incorrect, and throws for malformed arguments.


## Background
Busybot is an implementation of a more general version of the proof of work
scheme used by kCTF
(https://github.com/google/kctf/blob/v1/docker-images/challenge/pow.py), to
impose expensive work on pesky bots before serving their requests.

This implementation is pure js, with no run-time dependencies, and
compatible with any browser or js environment with BigInt support
(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

The ability to vary the mersenne exponent used as the base for the challenge
allows it to be adapted to a very wide range of difficulties (from ms to
minutes of work).

## Mathematical Details
We have a modulus m, which is a Mersenne prime (2^n -1) (kCTF uses n=1279.
but the ratio of difficulty of solving the challenge vs verifying it is
directly correlated to n, so use a larger n for more difficult challenges)

The challenge is for the client to perform a series of modular square roots
on some random value, provided by the server, flipping a bit between each
multiplication to prevent trivial shortcuts.

For the server to verify the challenge, it will square the result, flipping
the same bits between each step, and check if it gets back to the correct
initial value. Squaring is much faster to calculate than the square root (in
this implementation, about 3000x for n=3217).

Since Mersenne primes have remainder 3 mod 4, the square root step consists
of the calculation, x ^ ((m + 1)/4), from
https://en.wikipedia.org/wiki/Tonelli–Shanks_algorithm.

It is worth mentioning that only half of the numbers between 0 and m have a
square root, but this scheme applies the calculation x ^ ((m + 1)/4)
indiscriminately to any number. If some x does not in fact have a square
root, then the result of squaring the result is instead, -x (mod m). So even
after any number of operations, we can only be out by a factor of -1 (this
is why the verify step checks the final result against -x as well as x.)

For the squaring step in the verification, since a Mersenne prime is a
simple sum of 2^n - 2^0, the Barrett reduction of the square operation is
very cheap, consisting only of a few adds and shifts.


## Why this Proof-of-Work Scheme is Useful
This proof of work scheme is useful over a hash-collision type scheme, random
search scheme, or memory-bound scheme:
 * It is resistant to parallel implementation, so a multi-core server or GPU
   cannot solve it dramatically faster than a mobile device.
 * It only requires a small amount of memory, which is also fairer to mobile
   devices and means it does not degrade performance after the challenge has
   finished by evicting other resources from memory.
 * Since almost all modern devices have at least two cores, the impact of the
   challenge on the responsiveness of a webpage when implemented in a web
   worker is minimal.

It's especially important that a client with significant parallel GPU compute
cannot calculate a solution dramatically faster or cheaper than a client with a
single core processor.  (And this is appears to be why a challenge of this form
was chosen for kCTF too
https://github.com/google/kctf/commit/b770fad71304cb060475c98bcabd2e150d217ad0)

The proof-of-work does of course cause all clients to 'waste' time and energy.

It's best to impose difficult challenges only if some other signal indicates
that the requests might be abusive, such as a high rate of requests from an ip,
or another reputation metric, as an alternative to blocking requests
completely.

A group of 100 students in a school sharing the same ip address are not
significantly hampered by each having to wait 10 seconds to solve a busybot
challenge for an important request, but a single abusive client making 100
requests from the same IP address would have to spend 15 minutes of computing
time for the privilege.


# License
Licensed under Apache-2.0, see license.txt
