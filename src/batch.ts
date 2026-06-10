/**
 * Dispatch an array of items through an async mapper, processing
 * at most `concurrency` items simultaneously at any time.
 * Returns results in the same order as `items`.
 * Rejected items are included as `{ error: reason }` — the caller decides how to handle them.
 */
export async function batchMap<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T, index: number) => Promise<R>,
): Promise<(R | { error: unknown })[]> {
	const results: (R | { error: unknown })[] = new Array(items.length);
	let i = 0;

	const worker = async (): Promise<void> => {
		while (true) {
			const idx = i++;
			if (idx >= items.length) break;
			try {
				results[idx] = await fn(items[idx], idx);
			} catch (err) {
				results[idx] = { error: err };
			}
		}
	};

	const workers = Array.from(
		{ length: Math.min(concurrency, items.length) },
		() => worker(),
	);
	await Promise.all(workers);
	return results;
}
