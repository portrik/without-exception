import {
	isNone,
	isOption,
	isSome,
	type None,
	none,
	type Option,
	type Some,
	some,
} from "./common.ts";
import { isError, type Result } from "./result.ts";

const normalizeJSON = (
	json: string | Record<string, unknown>,
): Record<string, unknown> => {
	if (typeof json !== "string") {
		return json;
	}

	try {
		return JSON.parse(json);
	} catch {
		return {};
	}
};

const fromJSON = <Value extends NonNullable<unknown>>(
	json: string | Record<string, unknown>,
): Option<Value> => {
	const source = normalizeJSON(json);

	// biome-ignore lint/complexity/useLiteralKeys: Preventing clashes with noPropertyAccessFromIndexSignature in tsconfig.json
	if (source["some"] != null) {
		// biome-ignore lint/complexity/useLiteralKeys: Preventing clashes with noPropertyAccessFromIndexSignature in tsconfig.json
		return some(source["some"]) as Option<Value>;
	}

	return none();
};

const fromNullable = <Value extends NonNullable<unknown>>(
	value: Value | null | undefined,
): Option<Value> => {
	if (value == null) {
		return none();
	}

	return some(value);
};

const fromResult = <
	Value extends NonNullable<unknown>,
	ErrorValue extends NonNullable<unknown>,
>(
	result: Result<Value, ErrorValue>,
): Option<Value> => {
	if (isError(result)) {
		return none();
	}

	return some(result.value);
};

const all = <Value extends NonNullable<unknown>>(
	options: Option<Value>[],
): Option<Value[]> => {
	const combined: Value[] = [];

	for (const option of options) {
		if (isNone(option)) {
			return option;
		}

		combined.push(option.value);
	}

	return some(combined);
};

type FlattenedOption<TopOption extends Option<NonNullable<unknown>>> =
	TopOption extends Some<infer Value>
		? Value extends Option<NonNullable<unknown>>
			? FlattenedOption<Value>
			: Option<Value>
		: TopOption extends None
			? None
			: never;

const flatten = <Value extends NonNullable<unknown>>(
	option: Option<Value>,
): FlattenedOption<Option<Value>> => {
	let current: Option<NonNullable<unknown>> = option;
	while (isSome(current) && isOption(current.value)) {
		current = current.value;
	}

	return current as FlattenedOption<Option<Value>>;
};

const map = <
	Value extends NonNullable<unknown>,
	NewValue extends NonNullable<unknown>,
>(
	option: Option<Value>,
	mapper: (value: Value) => NewValue,
): Option<NewValue> => {
	if (isNone(option)) {
		return option;
	}

	return some(mapper(option.value));
};

const or = <Value extends NonNullable<unknown>>(
	first: Option<Value>,
	second: Option<Value>,
): Option<Value> => {
	if (isSome(first)) {
		return first;
	}

	return second;
};

const andThen = <
	Value extends NonNullable<unknown>,
	NewValue extends NonNullable<unknown>,
>(
	option: Option<Value>,
	callback: (value: Value) => Option<NewValue>,
): Option<NewValue> => {
	if (isNone(option)) {
		return option;
	}

	return callback(option.value);
};

const unwrap = <Value extends NonNullable<unknown>>(
	option: Option<Value>,
	defaultValue: Value,
): Value => {
	if (isNone(option)) {
		return defaultValue;
	}

	return option.value;
};

const values = <Value extends NonNullable<unknown>>(
	options: Option<Value>[],
): Value[] => {
	return options.filter(isSome).map(({ value }) => value);
};

export {
	some,
	none,
	fromJSON,
	fromNullable,
	fromResult,
	isOption,
	isSome,
	isNone,
	all,
	flatten,
	map,
	or,
	andThen,
	unwrap,
	values,
};
export type { Option, Some, None };
