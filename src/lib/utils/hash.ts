// content_hash: keccak256-style fingerprint of recipe content
// ingredients_fingerprint: hash of sorted ingredient id array (ignores quantities/units)

export async function contentHash(text: string): Promise<string> {
	const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return '0x' + Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function ingredientsFingerprint(ingredientIds: string[]): Promise<string> {
	const sorted = [...ingredientIds].sort().join(',');
	return contentHash(sorted);
}
