# Busybot: A non-parallelisable cryptographic proof of work scheme to slow down pesky bots, with no runtime dependencies.

Busyboy is an implementation of a more general version of the proof of work
scheme used by kCTF
(https://github.com/google/kctf/blob/v1/docker-images/challenge/pow.py), to
impose expensive work on pesky bots before serving their requests.

This implementation is pure js, with no run-time dependencies, and
compatible with any browser or js environment with BigInt support
(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

It is serially compute bound, not memory bound, and includes optimised
implementations of to both solve and verify challenges in pure JS.


## Mathematical Details
We have a modulus m, which is a Mersenne prime (2^n -1) (kCTF uses n=1279.
but the ratio of difficulty of solving the challenge vs verifying it is
directly correlated to n, so you can choose a larger n)

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
This proof of work scheme is useful over a hash-collision type scheme
because it is resistant to parallel implantation, not memory intensive, and
predictable in duration largely varying only by single core processing
speed, and the speed of the closest few KB of cache.

A client with significant parallel GPU compute cannot calculate a solution
dramatically faster or cheaper than a client with a single core processor.
(And these reasons appear to be why it was chosen for kCTF
https://github.com/google/kctf/commit/b770fad71304cb060475c98bcabd2e150d217ad0)

This scheme does of course cause all clients to 'waste' time and energy,
it's suggested to impose it only on a high rate of requests from a single ip
address, where it can avoid otherwise denying service to genuine users who
are sharing a connection: a group of 100 students in a school sharing the
same ip address are not significantly hampered by each having to wait 10
seconds for an important request, but a single abusive client making 100
requests would have to spend 15 minutes of computing time for the privilege.


# License
Licensed under Apache-2.0, see license.txt
