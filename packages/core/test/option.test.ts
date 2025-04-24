import { describe, expect, expectTypeOf, test } from "vitest";

import {
	type None,
	type Option,
	type Some,
	all,
	andThen,
	flatten,
	fromJSON,
	fromNullable,
	fromResult,
	isNone,
	isOption,
	isSome,
	map,
	none,
	or,
	some,
	unwrap,
	values,
} from "../src/option.ts";
import { error, ok } from "../src/result.ts";

describe("Option", () => {
	describe("Constructors", () => {
		test("some", () => {
			const option = some(1);

			expectTypeOf(option).toMatchObjectType<Some<number>>();
			expectTypeOf(option).toExtend<Option<number>>();
			expect(option.tag).toBeTypeOf("symbol");
			expect(option.value).toBe(1);
		});

		test("some async", async () => {
			const initialize = async () => 1;
			const option = await some(initialize());

			expectTypeOf(option).toMatchObjectType<Some<number>>();
			expectTypeOf(option).toExtend<Option<number>>();
			expect(option.tag).toBeTypeOf("symbol");
			expect(option.value).toBe(1);
		});

		test("none", () => {
			const option = none();

			expectTypeOf(option).toMatchObjectType<None>();
			expectTypeOf(option).toExtend<Option<NonNullable<unknown>>>();
			expect(option.tag).toBeTypeOf("symbol");
		});

		describe("fromJSON", () => {
			test("some", () => {
				const someOption = some(1);
				const someJSON = JSON.stringify(someOption);

				expect(someJSON).toStrictEqual(JSON.stringify({ some: 1 }));

				const someParsed = fromJSON<number>(someJSON);
				expectTypeOf(someParsed).toExtend<Option<number>>();
				expect(isOption(someParsed)).toBeTruthy();
				expect(isSome(someParsed)).toBeTruthy();
				expect((someParsed as Some<number>).value).toBe(1);
			});

			test("none", () => {
				const noneOption = none();
				const noneJSON = JSON.stringify(noneOption);

				expect(noneJSON).toStrictEqual(JSON.stringify({ none: null }));

				const noneParsed = fromJSON<number>(noneJSON);
				expectTypeOf(noneParsed).toExtend<Option<number>>();
				expect(isOption(noneParsed)).toBeTruthy();
				expect(isNone(noneParsed)).toBeTruthy();
			});

			test("invalid string", () => {
				const parsed = fromJSON("{");

				expectTypeOf(parsed).toExtend<Option<NonNullable<unknown>>>();
				expect(isOption(parsed)).toBeTruthy();
				expect(isNone(parsed)).toBeTruthy();
			});

			test("invalid object", () => {
				const parsed = fromJSON({});

				expectTypeOf(parsed).toExtend<Option<NonNullable<unknown>>>();
				expect(isOption(parsed)).toBeTruthy();
				expect(isNone(parsed)).toBeTruthy();
			});
		});

		describe("fromNullable", () => {
			test("some", () => {
				const option = fromNullable(1);

				expectTypeOf(option).toExtend<Option<number>>();
				expect(option.tag).toBeTypeOf("symbol");
				expect((option as Some<number>).value).toBe(1);
			});

			test.each([null, undefined])("none - %s", (value) => {
				const option = fromNullable(value);

				expectTypeOf(option).toExtend<Option<NonNullable<unknown>>>();
				expect(isNone(option)).toBeTruthy();
			});
		});

		describe("fromResult", () => {
			test("some", () => {
				const result = ok(1);
				const option = fromResult(result);

				expectTypeOf(option).toExtend<Option<number>>();
				expect((option as Some<number>).value).toBe(1);
			});

			test("none", () => {
				const result = error(1);
				const option = fromResult(result);

				expectTypeOf(option).toExtend<Option<NonNullable<unknown>>>();
				expect(isNone(option)).toBeTruthy();
			});
		});

		describe("Type Guards", () => {
			test("isOption", () => {
				expect(isOption(some(1))).toBeTruthy();
				expect(isOption(none())).toBeTruthy();
				expect(isOption("haha")).toBeFalsy();
			});

			test("isSome", () => {
				expect(isSome(some(1))).toBeTruthy();
				expect(isSome(none())).toBeFalsy();
			});

			test("isNone", () => {
				expect(isNone(some(1))).toBeFalsy();
				expect(isNone(none())).toBeTruthy();
			});
		});

		describe("Augmentors", () => {
			test("all", () => {
				const someOptions: Option<number>[] = Array.from(
					{ length: 10 },
					(_, index) => some(index),
				);

				const allSome = all(someOptions);
				expectTypeOf(allSome).toExtend<Option<number[]>>();
				expect(isSome(allSome)).toBeTruthy();
				expect((allSome as Some<number[]>).value).toStrictEqual([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
				]);

				const withNone = someOptions
					.slice(0, 5)
					.concat(none())
					.concat(someOptions.slice(5));
				const allNone = all(withNone);

				expectTypeOf(allNone).toExtend<Option<number[]>>();
				expect(isNone(allNone)).toBeTruthy();
			});

			test("flatten", () => {
				const nestedSome = some(some(some(some(some(some(some(some(1))))))));
				const flattenedSome = flatten(nestedSome);

				expectTypeOf(flattenedSome).toExtend<Option<number>>();
				expect(isSome(flattenedSome)).toBeTruthy();
				expect((flattenedSome as Some<number>).value).toBe(1);

				const nestedNone = some(some(some(some(some(some(some(none())))))));
				const flattenedNone = flatten(nestedNone);

				expectTypeOf(flattenedNone).toExtend<Option<number>>();
				expect(isNone(flattenedNone)).toBeTruthy();
			});

			test("map", () => {
				const callback = (value: number) => value + 1;

				const withSome = map(some(1), callback);
				expectTypeOf(withSome).toExtend<Option<number>>();
				expect(isSome(withSome)).toBeTruthy();
				expect((withSome as Some<number>).value).toBe(2);

				const withNone = map(none(), callback);
				expectTypeOf(withNone).toExtend<Option<number>>();
				expect(isNone(withNone)).toBeTruthy();
			});

			test("or", () => {
				const twoSome = or(some(1), some(2));
				expectTypeOf(twoSome).toExtend<Option<number>>();
				expect(isSome(twoSome)).toBeTruthy();
				expect((twoSome as Some<number>).value).toBe(1);

				const firstSome = or(some(1), none());
				expectTypeOf(firstSome).toExtend<Option<number>>();
				expect(isSome(firstSome)).toBeTruthy();
				expect((firstSome as Some<number>).value).toBe(1);

				const secondSome = or(none(), some(2));
				expectTypeOf(secondSome).toExtend<Option<number>>();
				expect(isSome(secondSome)).toBeTruthy();
				expect((secondSome as Some<number>).value).toBe(2);

				const twoNone = or(none(), none());
				expectTypeOf(twoNone).toExtend<Option<NonNullable<unknown>>>();
				expect(isNone(twoNone)).toBeTruthy();
			});

			test("andThen", () => {
				const callback = (value: number) => some(value + 1);

				const withSome = andThen(some(1), callback);
				expectTypeOf(withSome).toExtend<Option<number>>();
				expect(isSome(withSome)).toBeTruthy();
				expect((withSome as Some<number>).value).toBe(2);

				const withNone = andThen(none(), callback);
				expectTypeOf(withNone).toExtend<Option<number>>();
				expect(isNone(withNone)).toBeTruthy();
			});
		});

		describe("Mappers", () => {
			test("serializers", () => {
				const someOption = some(1);
				const noneOption = none();

				expect(String(someOption)).toBe("OptionSome<1>");
				expect(String(noneOption)).toBe("OptionNone");

				expect(JSON.stringify(someOption)).toBe(JSON.stringify({ some: 1 }));
				expect(JSON.stringify(noneOption)).toBe(JSON.stringify({ none: null }));
			});

			test("unwrap", () => {
				const withSome = unwrap(some(1), 2);

				expectTypeOf(withSome).toExtend<number>();
				expect(withSome).toBe(1);

				const withNone = unwrap(none() as Option<number>, 2);
				expectTypeOf(withNone).toExtend<number>();
				expect(withNone).toBe(2);
			});

			test("values", () => {
				const mapped = values(
					Array.from({ length: 10 }, (_, index) =>
						index % 2 === 0 ? some(index) : none(),
					),
				);

				expectTypeOf(mapped).toExtend<number[]>();
				expect(mapped).toStrictEqual([0, 2, 4, 6, 8]);
			});
		});
	});
});
