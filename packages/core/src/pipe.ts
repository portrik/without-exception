function pipe<A, B>(value: A, aToB: (value: A) => B): B;
function pipe<A, B, C>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
): C;
function pipe<A, B, C, D>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
): D;
function pipe<A, B, C, D, E>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
	dToE: (value: D) => E,
): E;
function pipe<A, B, C, D, E, F>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
	dToE: (value: D) => E,
	eToF: (value: E) => F,
): F;
function pipe<A, B, C, D, E, F, G>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
	dToE: (value: D) => E,
	eToF: (value: E) => F,
	fToG: (value: F) => G,
): G;
function pipe<A, B, C, D, E, F, G, H>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
	dToE: (value: D) => E,
	eToF: (value: E) => F,
	fToG: (value: F) => G,
	gToH: (value: G) => H,
): H;
function pipe<A, B, C, D, E, F, G, H, I>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
	dToE: (value: D) => E,
	eToF: (value: E) => F,
	fToG: (value: F) => G,
	gToH: (value: G) => H,
	hToI: (value: H) => I,
): I;
function pipe<A, B, C, D, E, F, G, H, I, J>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
	dToE: (value: D) => E,
	eToF: (value: E) => F,
	fToG: (value: F) => G,
	gToH: (value: G) => H,
	hToI: (value: H) => I,
	iToJ: (value: I) => J,
): J;
function pipe<A, B, C, D, E, F, G, H, I, J, K>(
	value: A,
	aToB: (value: A) => B,
	bToC: (value: B) => C,
	cToD: (value: C) => D,
	dToE: (value: D) => E,
	eToF: (value: E) => F,
	fToG: (value: F) => G,
	gToH: (value: G) => H,
	hToI: (value: H) => I,
	iToJ: (value: I) => J,
	jToK: (value: J) => K,
): K;
function pipe<A, B, C, D, E, F, G, H, I, J, K>(
	value: A,
	...functions: (((value: unknown) => unknown) | undefined)[]
): A | B | C | D | E | F | G | H | I | J | K {
	return functions
		.filter((callback) => callback != null)
		.reduce((current, callback) => callback(current), value as unknown) as
		| A
		| B
		| C
		| D
		| E
		| F
		| G
		| H
		| I
		| J
		| K;
}

export { pipe };
