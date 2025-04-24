import { isPromise } from "./utils.ts";

const SOME_SYMBOL = Symbol("Option Some");
const NONE_SYMBOL = Symbol("Option None");

const VALUE_SYMBOL = Symbol("Result Value");
const ERROR_SYMBOL = Symbol("Result Error");

type ResultCommon = {
	toString: () => string;
	toJSON: () => Record<string, unknown>;
	[key: symbol]: () => string;
};

type ResultOk<Value extends NonNullable<unknown>> = {
	readonly tag: typeof VALUE_SYMBOL;
	readonly value: Value;
};

type ResultError<ErrorValue extends NonNullable<unknown>> = {
	readonly tag: typeof ERROR_SYMBOL;
	readonly error: ErrorValue;
};

type Result<
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
> = ResultOk<Value> | ResultError<ErrorValue>;

const okConstructor = <Value extends NonNullable<unknown>>(
	value: Value,
): ResultOk<Value> => {
	const result = {
		tag: VALUE_SYMBOL,
		value: value,

		toString: () => `ResultOk<${value}>`,
		[Symbol.for("nodejs.util.inspect.custom")]: () => `ResultOk<${value}>`,
		toJSON: () => ({ value: value }),
	} satisfies ResultCommon & ResultOk<Value>;

	return result;
};

function ok<Value extends NonNullable<unknown>>(
	value: Promise<Value>,
): Promise<ResultOk<Value>>;
function ok<Value extends NonNullable<unknown>>(value: Value): ResultOk<Value>;
function ok<Value extends NonNullable<unknown>>(
	value: Value | Promise<Value>,
): ResultOk<Value> | Promise<ResultOk<Value>> {
	if (isPromise(value)) {
		return value.then(okConstructor);
	}

	return okConstructor(value);
}

const errorConstructor = <ErrorValue extends NonNullable<unknown>>(
	error: ErrorValue,
): ResultError<ErrorValue> => {
	const result = {
		tag: ERROR_SYMBOL,
		error: error,

		toString: () => `ResultError<${error}>`,
		[Symbol.for("nodejs.util.inspect.custom")]: () => `ResultError<${error}>`,
		toJSON: () => ({ error: error }),
	} satisfies ResultCommon & ResultError<ErrorValue>;

	return result;
};

function error<ErrorValue extends NonNullable<unknown>>(
	error: Promise<ErrorValue>,
): Promise<ResultError<ErrorValue>>;
function error<ErrorValue extends NonNullable<unknown>>(
	error: ErrorValue,
): ResultError<ErrorValue>;
function error<ErrorValue extends NonNullable<unknown>>(
	error: Promise<ErrorValue> | ErrorValue,
): Promise<ResultError<ErrorValue>> | ResultError<ErrorValue> {
	if (isPromise(error)) {
		return error.then(errorConstructor);
	}

	return errorConstructor(error);
}

const isResult = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	value: unknown,
): value is Result<Value, ErrorValue> => {
	return (
		value != null &&
		typeof value === "object" &&
		"tag" in value &&
		(value.tag === VALUE_SYMBOL || value.tag === ERROR_SYMBOL)
	);
};

const isOk = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
): result is ResultOk<Value> => {
	return result.tag === VALUE_SYMBOL;
};

const isError = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
): result is ResultError<ErrorValue> => {
	return result.tag === ERROR_SYMBOL;
};

type OptionCommon = {
	toString: () => string;
	toJSON: () => Record<string, unknown>;
	[key: symbol]: () => string;
};

type Some<Value extends NonNullable<unknown>> = {
	readonly tag: typeof SOME_SYMBOL;
	readonly value: Value;
};

type None = {
	tag: typeof NONE_SYMBOL;
};

type Option<Value extends NonNullable<unknown>> = Some<Value> | None;

const someConstructor = <Value extends NonNullable<unknown>>(
	value: Value,
): Some<Value> => {
	const option = {
		tag: SOME_SYMBOL,
		value: value,

		toString: () => `OptionSome<${value}>`,
		[Symbol.for("nodejs.util.inspect.custom")]: () => `OptionSome<${value}>`,
		toJSON: () => ({ some: value }),
	} satisfies OptionCommon & Some<Value>;

	return option;
};

function some<Value extends NonNullable<unknown>>(
	value: Promise<Value>,
): Promise<Some<Value>>;
function some<Value extends NonNullable<unknown>>(value: Value): Some<Value>;
function some<Value extends NonNullable<unknown>>(
	value: Promise<Value> | Value,
): Promise<Some<Value>> | Some<Value> {
	if (isPromise(value)) {
		return value.then(someConstructor);
	}

	return someConstructor(value);
}

const none = (): None => {
	const option = {
		tag: NONE_SYMBOL,

		toString: () => "OptionNone",
		[Symbol.for("nodejs.util.inspect.custom")]: () => "OptionNone",
		toJSON: () => ({ none: null }),
	} satisfies OptionCommon & None;

	return option;
};

const isOption = <Value extends NonNullable<unknown>>(
	value: unknown,
): value is Option<Value> => {
	return (
		value != null &&
		typeof value === "object" &&
		"tag" in value &&
		(value.tag === SOME_SYMBOL || value.tag === NONE_SYMBOL)
	);
};

const isSome = <Value extends NonNullable<unknown>>(
	value: Option<Value>,
): value is Some<Value> => {
	return value.tag === SOME_SYMBOL;
};

const isNone = <Value extends NonNullable<unknown>>(value: Option<Value>) => {
	return value.tag === NONE_SYMBOL;
};

export {
	ok,
	error,
	isResult,
	isOk,
	isError,
	some,
	none,
	isOption,
	isSome,
	isNone,
};
export type { Result, ResultOk, ResultError, Option, Some, None };
