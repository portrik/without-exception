import { describe, expect, expectTypeOf, test } from "vitest";

import { none, some } from "../src/option.ts";
import {
	all,
	andThen,
	error,
	flatten,
	fromJSON,
	fromOption,
	fromUnsafe,
	type InvalidJSONError,
	isError,
	isOk,
	isResult,
	map,
	mapError,
	match,
	ok,
	or,
	partition,
	type Result,
	type ResultError,
	type ResultOk,
	type UnexpectedErrorValue,
	unwrap,
	unwrapBoth,
	unwrapError,
} from "../src/result.ts";

describe("Result", () => {
	describe("Constructors", () => {
		test("ok", () => {
			const result = ok(1);

			expectTypeOf(result).toMatchObjectType<ResultOk<number>>();
			expectTypeOf(result).toExtend<Result<number, NonNullable<unknown>>>();
			expect(result.tag).toBeTypeOf("symbol");
			expect(result.value).toBe(1);
		});

		test("ok async", async () => {
			const promise = async () => 12;
			const result = await ok(promise());

			expectTypeOf(result).toMatchObjectType<ResultOk<number>>();
			expectTypeOf(result).toExtend<Result<number, NonNullable<unknown>>>();
			expect(result.tag).toBeTypeOf("symbol");
			expect(result.value).toBe(12);
		});

		test("error", () => {
			const result = error(1);

			expectTypeOf(result).toMatchObjectType<ResultError<number>>();
			expectTypeOf(result).toExtend<Result<NonNullable<unknown>, number>>();
			expect(result.tag).toBeTypeOf("symbol");
			expect(result.error).toBe(1);
		});

		test("error async", async () => {
			const promise = async () => 12;
			const result = await error(promise());

			expectTypeOf(result).toMatchObjectType<ResultError<number>>();
			expectTypeOf(result).toExtend<Result<NonNullable<unknown>, number>>();
			expect(result.tag).toBeTypeOf("symbol");
			expect((result as ResultError<number>).error).toBe(12);
		});

		describe("fromJSON", () => {
			test("ok", () => {
				const okResult = ok(1);
				const okJSON = JSON.stringify(okResult);

				expect(okJSON).toStrictEqual(JSON.stringify({ value: 1 }));

				const okParsed = fromJSON<number, string>(okJSON);
				expectTypeOf(okParsed).toExtend<
					Result<number, string | InvalidJSONError>
				>();
				expect(isResult(okParsed)).toBeTruthy();
				expect(isOk(okParsed)).toBeTruthy();
				expect((okParsed as ResultOk<number>).value).toBe(1);
			});

			test("error", () => {
				const errorResult = error("1");
				const errorJSON = JSON.stringify(errorResult);

				expect(errorJSON).toStrictEqual(JSON.stringify({ error: "1" }));

				const errorParsed = fromJSON<number, string>(errorJSON);
				expectTypeOf(errorParsed).toExtend<
					Result<NonNullable<unknown>, NonNullable<unknown> | InvalidJSONError>
				>();
				expect(isResult(errorParsed)).toBeTruthy();
				expect(isError(errorParsed)).toBeTruthy();
				expect((errorParsed as ResultError<string>).error).toBe("1");
			});

			test("invalid object", () => {
				const result = fromJSON<number, string>({});

				expectTypeOf(result).toExtend<
					Result<number, string | InvalidJSONError>
				>();
				expect(isError(result)).toBeTruthy();
				expect((result as ResultError<InvalidJSONError>).error.message).toBe(
					"The supplied JSON is not a valid Result.",
				);
			});

			test("invalid JSON", () => {
				const result = fromJSON<number, string>("{");

				expectTypeOf(result).toExtend<
					Result<number, string | InvalidJSONError>
				>();
				expect(isError(result)).toBeTruthy();
				expect((result as ResultError<Error>).error.message).toBe(
					"Expected property name or '}' in JSON at position 1 (line 1 column 2)",
				);
			});
		});

		describe("fromUnsafe", () => {
			test("ok", () => {
				const result = fromUnsafe(() => 1);

				expectTypeOf(result).toExtend<
					Result<number, Error | UnexpectedErrorValue>
				>();
				expect(isOk(result)).toBeTruthy();
				expect((result as ResultOk<number>).value).toBe(1);
			});

			test("error", () => {
				const errorValue = new Error("whoopsie");
				const result = fromUnsafe<number>(() => {
					throw errorValue;
				});

				expectTypeOf(result).toExtend<
					Result<number, Error | UnexpectedErrorValue>
				>();
				expect(isError(result)).toBeTruthy();
				expect((result as ResultError<Error>).error).toStrictEqual(errorValue);
			});

			test("error with invalid error type", () => {
				const result = fromUnsafe<number>(() => {
					throw 1;
				});

				expectTypeOf(result).toExtend<
					Result<number, Error | UnexpectedErrorValue>
				>();
				expect(isError(result)).toBeTruthy();
				expect(
					(result as ResultError<UnexpectedErrorValue>).error.message,
				).toEqual(
					'Invalid value has been thrown instead of Error. See the "value" attribute on this error.',
				);
				expect(
					(result as ResultError<UnexpectedErrorValue>).error.value,
				).toEqual(1);
			});

			test("ok async", async () => {
				const result = await fromUnsafe((async () => 1)());

				expectTypeOf(result).toExtend<
					Result<number, Error | UnexpectedErrorValue>
				>();
				expect(isOk(result)).toBeTruthy();
				expect((result as ResultOk<number>).value).toBe(1);
			});

			test("error async", async () => {
				const errorValue = new Error("whoopsie");
				const result = await fromUnsafe<number>(
					(async () => {
						throw errorValue;
					})(),
				);

				expectTypeOf(result).toExtend<
					Result<number, Error | UnexpectedErrorValue>
				>();
				expect(isError(result)).toBeTruthy();
				expect((result as ResultError<Error>).error).toStrictEqual(errorValue);
			});

			test("error async with invalid error type", async () => {
				const result = await fromUnsafe<number>(
					(async () => {
						throw 1;
					})(),
				);

				expectTypeOf(result).toExtend<
					Result<number, Error | UnexpectedErrorValue>
				>();
				expect(isError(result)).toBeTruthy();
				expect(
					(result as ResultError<UnexpectedErrorValue>).error.message,
				).toEqual(
					'Invalid value has been thrown instead of Error. See the "value" attribute on this error.',
				);
			});
		});

		test("fromOption", () => {
			const someResult = fromOption(some(1), "2");
			expectTypeOf(someResult).toExtend<Result<number, string>>();
			expect(isOk(someResult)).toBeTruthy();
			expect((someResult as ResultOk<number>).value).toBe(1);

			const noneResult = fromOption<number, string>(none(), "2");
			expectTypeOf(noneResult).toExtend<Result<number, string>>();
			expect(isError(noneResult)).toBeTruthy();
			expect((noneResult as ResultError<string>).error).toBe("2");
		});
	});

	describe("Type Guards", () => {
		test("isResult", () => {
			expect(isResult(ok(1))).toBeTruthy();
			expect(isResult(error(1))).toBeTruthy();

			expect(isResult([])).toBeFalsy();
		});

		test("isOk", () => {
			expect(isOk(ok(1))).toBeTruthy();

			expect(isOk(error(1))).toBeFalsy();
		});

		test("isError", () => {
			expect(isError(error(1))).toBeTruthy();

			expect(isError(ok(1))).toBeFalsy();
		});
	});

	describe("Augmentors", () => {
		test("all", () => {
			const results: Result<number, string>[] = Array.from({ length: 10 }, () =>
				ok(1),
			);

			const allResults = all(results);
			expectTypeOf(allResults).toExtend<Result<number[], string>>();
			expect(isOk(allResults)).toBeTruthy();
			expect((allResults as ResultOk<number[]>).value).toStrictEqual(
				Array.from({ length: 10 }, () => 1),
			);

			const withError = results
				.slice(0, 5)
				.concat(error("2"))
				.concat(results.slice(5));
			const allError = all(withError);
			expectTypeOf(allError).toExtend<Result<number[], string>>();
			expect(isError(allError)).toBeTruthy();
			expect((allError as ResultError<string>).error).toBe("2");
		});

		test("flatten", () => {
			const nestedOk = ok(ok(ok(ok(ok(1)))));
			const okResult = flatten(nestedOk);

			expectTypeOf(okResult).toExtend<Result<number, NonNullable<unknown>>>();
			expect(isOk(okResult)).toBeTruthy();
			expect((okResult as ResultOk<number>).value).toBe(1);

			const nestedError = ok(ok(ok(error(error("2")))));
			const errorResult = flatten(nestedError);

			expectTypeOf(errorResult).toExtend<
				Result<NonNullable<unknown>, string | NonNullable<unknown>>
			>();
			expect(isError(errorResult)).toBeTruthy();
			expect((errorResult as ResultError<string>).error).toBe("2");

			const nestedBoth = ok(ok(error(error(ok(ok(error(error("2"))))))));
			const bothResult = flatten(nestedBoth);

			expectTypeOf(bothResult).toExtend<
				Result<NonNullable<unknown>, string | NonNullable<unknown>>
			>();
			expect(isError(bothResult)).toBeTruthy();
			expect((bothResult as ResultError<string>).error).toBe("2");
		});

		test("or", () => {
			const twoOKs = or(ok(1), ok(2));
			expectTypeOf(twoOKs).toExtend<Result<number, NonNullable<unknown>>>();
			expect(isOk(twoOKs)).toBeTruthy();
			expect((twoOKs as ResultOk<number>).value).toBe(1);

			const firstOk = or(ok(1), error("2"));
			expectTypeOf(firstOk).toExtend<Result<number, string>>();
			expect(isOk(firstOk)).toBeTruthy();
			expect((firstOk as ResultOk<number>).value).toBe(1);

			const secondOk = or(error("1"), ok(2));
			expectTypeOf(secondOk).toExtend<Result<number, NonNullable<unknown>>>();
			expect(isOk(secondOk)).toBeTruthy();
			expect((secondOk as ResultOk<number>).value).toBe(2);

			const twoErrors = or(error("1"), error("2"));
			expectTypeOf(twoErrors).toExtend<Result<NonNullable<unknown>, string>>();
			expect(isError(twoErrors)).toBeTruthy();
			expect((twoErrors as ResultError<string>).error).toBe("2");
		});

		test("andThen", () => {
			const initialResult: Result<number, Error> = ok(1);

			const okResult = andThen(
				initialResult as Result<number, Error>,
				(value): Result<number, string> => ok(value + 1),
			);
			expectTypeOf(okResult).toExtend<Result<number, string | Error>>();
			expect(isOk(okResult)).toBeTruthy();
			expect((okResult as ResultOk<number>).value).toBe(2);

			const errorResult = andThen(
				ok(1) as Result<number, Error>,
				(value): Result<number, string> => error(String(value - 1)),
			);
			expectTypeOf(errorResult).toExtend<Result<number, string | Error>>();
			expect(isError(errorResult)).toBeTruthy();
			expect((errorResult as ResultError<string>).error).toBe("0");

			const andThenError = andThen(
				error("2") as Result<number, string>,
				(value): Result<number, string> => ok(value + 1),
			);
			expectTypeOf(andThenError).toExtend<Result<number, string>>();
			expect(isError(andThenError)).toBeTruthy();
			expect((andThenError as ResultError<string>).error).toBe("2");
		});
	});

	describe("mappers", () => {
		test("map", () => {
			const mapper = (value: number) => value + 1;

			const okResult = map(ok(1), mapper);
			expectTypeOf(okResult).toExtend<Result<number, NonNullable<unknown>>>();
			expect(isOk(okResult)).toBeTruthy();
			expect((okResult as ResultOk<number>).value).toBe(2);

			const errorResult = map(error("1"), mapper);
			expectTypeOf(errorResult).toExtend<Result<number, string>>();
			expect(isError(errorResult)).toBeTruthy();
			expect((errorResult as ResultError<string>).error).toBe("1");
		});

		test("mapError", () => {
			const mapper = (value: number) => String(value + 1);

			const okResult = mapError(ok(1), mapper);
			expectTypeOf(okResult).toExtend<Result<number, string>>();
			expect(isOk(okResult)).toBeTruthy();
			expect((okResult as ResultOk<number>).value).toBe(1);

			const errorResult = mapError(error(1), mapper);
			expectTypeOf(errorResult).toExtend<
				Result<NonNullable<unknown>, string>
			>();
			expect(isError(errorResult)).toBeTruthy();
			expect((errorResult as ResultError<string>).error).toBe("2");
		});

		test("match", () => {
			const onOk = (value: number) => value + 1;
			const onError = (value: number) => value - 1;

			const okResult = match(ok(1), onOk, onError);
			expectTypeOf(okResult).toExtend<number>();
			expect(okResult).toBe(2);

			const errorResult = match(error(1), onOk, onError);
			expectTypeOf(errorResult).toExtend<number>();
			expect(errorResult).toBe(0);
		});

		test("partition", () => {
			const results = [
				ok(1),
				error("2"),
				ok(3),
				error("4"),
				ok(5),
				error("6"),
				ok(7),
				error("8"),
				ok(9),
				error("10"),
			];

			const partitioned = partition(results);
			expectTypeOf(partitioned).toExtend<[number[], string[]]>();
			expect(partitioned).toStrictEqual([
				[1, 3, 5, 7, 9],
				["2", "4", "6", "8", "10"],
			]);
		});

		test("serializers", () => {
			const okResult = ok(1);
			const errorResult = error(2);

			expect(String(okResult)).toBe("ResultOk<1>");
			expect(String(errorResult)).toBe("ResultError<2>");

			expect(JSON.stringify(okResult)).toBe(JSON.stringify({ value: 1 }));
			expect(JSON.stringify(errorResult)).toBe(JSON.stringify({ error: 2 }));
		});

		test("unwrap", () => {
			expect(unwrap(ok(1), 0)).toBe(1);

			expect(unwrap(error(1), 0)).toBe(0);
		});

		test("unwrapError", () => {
			expect(unwrapError(ok(1), 0)).toBe(0);

			expect(unwrapError(error(1), 0)).toBe(1);
		});

		test("unwrapBoth", () => {
			expect(unwrapBoth(ok(1))).toBe(1);

			expect(unwrapBoth(error(0))).toBe(0);
		});
	});
});
