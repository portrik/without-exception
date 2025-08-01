import {
	error,
	isError,
	isOk,
	isResult,
	ok,
	type Result,
	type ResultError,
	type ResultOk,
} from "./common.ts";
import { isNone, type Option } from "./option.ts";

class InvalidJSONError extends Error {
	constructor() {
		super("The supplied JSON is not a valid Result.");
	}
}

const fromJSON = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	json: string | Record<string, unknown>,
): Result<Value, ErrorValue | InvalidJSONError> => {
	const source =
		typeof json === "string"
			? fromUnsafe<Record<string, unknown>>(() => JSON.parse(json))
			: ok(json);

	if (isError(source)) {
		return source;
	}

	const parsed = source.value;
	// biome-ignore lint/complexity/useLiteralKeys: Preventing clashes with noPropertyAccessFromIndexSignature in tsconfig.json
	if (parsed["error"] != null) {
		// biome-ignore lint/complexity/useLiteralKeys: Preventing clashes with noPropertyAccessFromIndexSignature in tsconfig.json
		return error(parsed["error"]) as ResultError<ErrorValue>;
	}

	// biome-ignore lint/complexity/useLiteralKeys: Preventing clashes with noPropertyAccessFromIndexSignature in tsconfig.json
	if (parsed["value"] != null) {
		// biome-ignore lint/complexity/useLiteralKeys: Preventing clashes with noPropertyAccessFromIndexSignature in tsconfig.json
		return ok(parsed["value"]) as ResultOk<Value>;
	}

	return error(new InvalidJSONError());
};

class UnexpectedErrorValue extends Error {
	public readonly value: unknown;

	constructor(value: unknown) {
		super(
			'Invalid value has been thrown instead of Error. See the "value" attribute on this error.',
		);

		this.value = value;
	}
}

const fromUnsafeAsync = async <Value extends NonNullable<unknown>>(
	callback: Promise<Value>,
): Promise<Result<Value, Error>> => {
	try {
		const value = await callback;

		return ok(value);
	} catch (err) {
		if (err instanceof Error) {
			return error(err);
		}

		return error(new UnexpectedErrorValue(err));
	}
};

function fromUnsafe<Value extends NonNullable<unknown>>(
	callback: Promise<Value>,
): Promise<Result<Value, Error | UnexpectedErrorValue>>;
function fromUnsafe<Value extends NonNullable<unknown>>(
	callback: () => Value,
): Result<Value, Error | UnexpectedErrorValue>;
function fromUnsafe<Value extends NonNullable<unknown>>(
	callback: Promise<Value> | (() => Value),
):
	| Promise<Result<Value, Error | UnexpectedErrorValue>>
	| Result<Value, Error | UnexpectedErrorValue> {
	if (callback instanceof Promise) {
		return fromUnsafeAsync(callback);
	}

	try {
		const value = callback();

		return ok(value);
	} catch (err) {
		if (err instanceof Error) {
			return error(err);
		}

		return error(new UnexpectedErrorValue(err));
	}
}

const fromOption = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	option: Option<Value>,
	errorValue: ErrorValue,
): Result<Value, ErrorValue> => {
	if (isNone(option)) {
		return error(errorValue);
	}

	return ok(option.value);
};

const all = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	results: Result<Value, ErrorValue>[],
): Result<Value[], ErrorValue> => {
	const combinedList: Value[] = [];

	for (const result of results) {
		if (isError(result)) {
			return result;
		}

		combinedList.push(result.value);
	}

	return ok(combinedList);
};

type FlattenResultRecursive<InputResult> = InputResult extends ResultOk<
	infer InnerValue
>
	? InnerValue extends Result<NonNullable<unknown>, NonNullable<unknown>>
		? FlattenResultRecursive<InnerValue>
		: ResultOk<InnerValue>
	: InputResult extends ResultError<infer InnerErrorValue>
		? InnerErrorValue extends Result<NonNullable<unknown>, NonNullable<unknown>>
			? FlattenResultRecursive<InnerErrorValue>
			: ResultError<InnerErrorValue>
		: never;

type FlattenedResult<
	InputResult extends Result<NonNullable<unknown>, NonNullable<unknown>>,
> = FlattenResultRecursive<InputResult>;

const flatten = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
): FlattenedResult<Result<Value, ErrorValue>> => {
	let current: Result<NonNullable<unknown>, NonNullable<unknown>> = result;
	while (
		(isOk(current) && isResult(current.value)) ||
		(isError(current) && isResult(current.error))
	) {
		current = (isOk(current) ? current.value : current.error) as Result<
			NonNullable<unknown>,
			NonNullable<unknown>
		>;
	}

	return current as FlattenedResult<Result<Value, ErrorValue>>;
};

const map = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
	NewValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
	mapper: (value: Value) => NewValue,
): Result<NewValue, ErrorValue> => {
	if (isError(result)) {
		return result;
	}

	return ok(mapper(result.value));
};

const mapError = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
	NewErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
	mapper: (error: ErrorValue) => NewErrorValue,
): Result<Value, NewErrorValue> => {
	if (isOk(result)) {
		return result;
	}

	return error(mapper(result.error));
};

const match = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
	ReturnType extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
	onValue: (value: Value) => ReturnType,
	onError: (error: ErrorValue) => ReturnType,
): ReturnType => {
	if (isOk(result)) {
		return onValue(result.value);
	}

	return onError(result.error);
};

const or = <
	Value extends NonNullable<unknown>,
	FirstErrorValue extends NonNullable<unknown>,
	SecondErrorValue extends NonNullable<unknown>,
>(
	first: Result<Value, FirstErrorValue>,
	second: Result<Value, SecondErrorValue>,
): Result<Value, SecondErrorValue> => {
	if (isOk(first)) {
		return first;
	}

	return second;
};

const partition = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	results: Result<Value, ErrorValue>[],
): [Value[], ErrorValue[]] => {
	return results.reduce<[Value[], ErrorValue[]]>(
		([values, errors], current) => {
			if (isOk(current)) {
				return [values.concat(current.value), errors] as [
					Value[],
					ErrorValue[],
				];
			}

			return [values, errors.concat(current.error)] as [Value[], ErrorValue[]];
		},
		[[], []],
	);
};

const andThen = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
	NewValue extends NonNullable<unknown>,
	NewErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
	callback: (result: Value) => Result<NewValue, NewErrorValue>,
): Result<NewValue, ErrorValue | NewErrorValue> => {
	if (isError(result)) {
		return result;
	}

	return callback(result.value);
};

const unwrap = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
	defaultValue: Value,
): Value => {
	return isOk(result) ? result.value : defaultValue;
};

const unwrapBoth = <Value extends NonNullable<unknown>>(
	result: Result<Value, Value>,
): Value => {
	if (isOk(result)) {
		return result.value;
	}

	return result.error;
};

const unwrapError = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
	defaultValue: ErrorValue,
): ErrorValue => {
	return isError(result) ? result.error : defaultValue;
};

export type {
	Result,
	ResultOk,
	ResultError,
	InvalidJSONError,
	UnexpectedErrorValue,
};
export {
	ok,
	error,
	all,
	flatten,
	fromJSON,
	fromUnsafe,
	fromOption,
	isOk,
	isError,
	isResult,
	map,
	mapError,
	match,
	or,
	partition,
	andThen,
	unwrap,
	unwrapBoth,
	unwrapError,
};
