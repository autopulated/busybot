// Type definitions for busybot
// Project: Busybot - kCTF Proof of Work implementation
// Definitions by: Autopulated

export as namespace Busybot;

// ========================================
// Core Types
// ========================================

/**
 * A mathematical challenge for the client to solve
 */
export interface Challenge {
    /** Hex-encoded BigInt random challenge value (e.g., '0xabc123...') */
    c: string;
    /** Number of iterations of modular square root to calculate (positive integer) */
    d: number;
    /** Mersenne prime exponent to use for modular arithmetic (must be a known Mersenne exponent) */
    m: number;
}

/**
 * Solution to a challenge
 */
export interface Solution {
    /** Hex-encoded BigInt, challenge value after d modular square roots, followed by bit flips */
    s: string;
}

/**
 * Progress callback function for solve operation
 */
export type ProgressCallback = (progress: number) => void;

/**
 * Options for generate function
 */
export interface GenerateOptions {
    /** Mersenne prime exponent (default: 1279) */
    forMersenneExponent?: number;
    /** Difficulty - number of iterations (positive integer) */
    withDifficulty: number;
}

/**
 * Options for solve function
 */
export interface SolveOptions {
    /** Optional callback to receive progress updates (0-1) */
    progressCallback?: ProgressCallback;
}

/**
 * Configuration for initializing modular arithmetic functions
 */
export interface MathsConfig {
    /** Mersenne prime exponent to use as modulus base */
    forMersenneExponent: number;
}

/**
 * Collection of modular arithmetic functions for a specific Mersenne exponent
 */
export interface MathsFunctions {
    /** The modulus value (2^n - 1) */
    modulus: bigint;
    
    /** The exponent used for square root calculation ((modulus + 1) / 4) */
    exponent: bigint;
    
    /** Basic Barrett multiplication implementation */
    barrettMul(a: bigint, b: bigint): bigint;
    
    /** Optimized Barrett squaring for Mersenne primes */
    barrettFastSquare(a: bigint): bigint;
    
    /** Fast modular power (right-to-left binary method with Barrett reduction) */
    fastModPow(base: bigint): bigint;
    
    /** Optimized exponentiation by squaring for the fixed exponent */
    fastFixedExpPow(base: bigint): bigint;
}

// ========================================
// API Functions
// ========================================

/**
 * Generate a new proof-of-work challenge
 * 
 * @param options - Configuration for the challenge
 * @returns Promise that resolves to a Challenge object
 * @throws {Error} If Mersenne exponent is invalid, too small, or difficulty is invalid
 * 
 * @remarks
 * - Only supported in Node.js environment
 * - Uses crypto.randomBytes for secure random number generation
 * - Challenge byte length is floor(exponent/8) for exponents < 128, otherwise 16 bytes
 */
export function generate(options: GenerateOptions): Promise<Challenge>;

/**
 * Solve a proof-of-work challenge
 * 
 * @param challenge - The challenge to solve
 * @param options - Optional configuration including progress callback
 * @returns Solution containing the computed value
 * @throws {Error} If challenge is malformed or invalid
 * 
 * @remarks
 * - Performs 'd' iterations of modular square root with bit flips
 * - Progress callback receives values from 0 to 1
 * - Approximately 'd' times more expensive than verification
 */
export function solve(challenge: Challenge, options?: SolveOptions): Solution;

/**
 * Verify a solution against its original challenge
 * 
 * @param challenge - The original challenge
 * @param solution - The solution to verify
 * @returns True if solution is correct, false otherwise
 * @throws {Error} If challenge or solution is malformed
 * 
 * @remarks
 * - Squares the solution 'd' times (with bit flips) and compares to original
 * - Also checks against the negative value (modulus - original)
 * - Much faster than solve() (about 3000x for exponent 3217)
 */
export function verify(challenge: Challenge, solution: Solution): boolean;

/**
 * Initialize modular arithmetic functions for a specific Mersenne prime
 * 
 * @param config - Configuration specifying the Mersenne exponent
 * @returns Object containing modular arithmetic functions
 * @throws {Error} If the provided exponent is not a known Mersenne exponent
 * 
 * @remarks
 * - All returned functions operate in the modulus (2^n - 1)
 * - Barrett reduction is optimized for Mersenne primes
 * - fastFixedExpPow is approximately 'n' times faster than fastModPow
 */
export function initMathsFunctions(config: MathsConfig): MathsFunctions;

// ========================================
// Constants
// ========================================

/**
 * Known Mersenne prime exponents from OEIS A000043
 * 
 * @remarks
 * Only these exponents are guaranteed to produce valid Mersenne primes
 * 
 * @example
 * [2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, ...]
 */
export const Known_Mersenne_Exponents: readonly number[];

/**
 * Bit pattern flipped between each iteration
 * 
 * @remarks
 * kCTF implementation flips only the least significant bit.
 * Changing this constant would break compatibility with standard challenges.
 */
export const Flip_Bits: 1n;

/**
 * Check if a number is a known Mersenne exponent
 * 
 * @param n - Number to check
 * @returns True if n is in Known_Mersenne_Exponents
 */
export function isMersenneExponent(n: number): boolean;

// ========================================
// Default Export
// ========================================

/**
 * Default export containing all public API functions
 */
declare const api: {
    generate: typeof generate;
    solve: typeof solve;
    verify: typeof verify;
    initMathsFunctions: typeof initMathsFunctions;
};

export default api;
