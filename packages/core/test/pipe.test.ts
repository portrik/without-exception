import { describe, expect, expectTypeOf, test } from "vitest";

import {
	fromNullable,
	isOption,
	isSome,
	type Option,
	type Some,
} from "../src/option.ts";
import { pipe } from "../src/pipe.ts";
import {
	fromUnsafe,
	map,
	type Result,
	type UnexpectedErrorValue,
	unwrap,
} from "../src/result.ts";

describe("Pipe", () => {
	test("pipe", () => {
		const result = pipe(
			1,
			(value: number): number => value + 1,
			(value: number): string => String(value),
			(value: string): { value: string } => ({ value: value }),
			(value: { value: string }): string => JSON.stringify(value),
			(
				value: string,
			): Result<{ value: string }, Error | UnexpectedErrorValue> =>
				fromUnsafe((): { value: string } => JSON.parse(value)),
			(
				value: Result<{ value: string }, Error | UnexpectedErrorValue>,
			): Result<number, Error | UnexpectedErrorValue> =>
				map(value, (innerValue) => Number.parseInt(innerValue.value, 10)),
			(value: Result<number, Error | UnexpectedErrorValue>): number =>
				unwrap(value, 42),
			(value: number): number[] =>
				Array.from({ length: value }, (_, index) => index),
			(value: number[]): Set<number> | null => new Set(value),
			(value: Set<number> | null): Option<Set<number>> => fromNullable(value),
		);

		expectTypeOf(result).toExtend<Option<Set<number>>>();
		expect(isOption(result)).toBeTruthy();
		expect(isSome(result)).toBeTruthy();
		expect((result as Some<Set<number>>).value).toStrictEqual(new Set([0, 1]));
	});
});
