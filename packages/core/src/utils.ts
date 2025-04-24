const isPromise = <PromiseValue>(
	value: unknown,
): value is Promise<PromiseValue> => {
	return (
		value != null &&
		Object.prototype.toString.call(value) === "[object Promise]"
	);
};

export { isPromise };
