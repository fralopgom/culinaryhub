import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SECTION_ING  = /^(ingredientes?|ingredients?)\s*:?\s*$/i;
const SECTION_PREP = /^(preparaci[oó]n|pasos?|instrucciones?|elaboraci[oó]n|m[eé]todo|preparation|steps?|method|directions?)\s*:?\s*$/i;
const SEPARATOR    = /^[-─=*]{3,}$/;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401);

	const { text } = await request.json().catch(() => ({}));
	if (!text?.trim()) error(400, 'text_required');

	const lines = (text as string).split('\n').map((l: string) => l.trim()).filter(Boolean);

	const ingIdx  = lines.findIndex((l) => SECTION_ING.test(l));
	const prepIdx = lines.findIndex((l) => SECTION_PREP.test(l));

	let title = '';
	let description = '';
	let ingredientLines: string[] = [];
	let stepLines: string[] = [];

	if (ingIdx >= 0 || prepIdx >= 0) {
		const firstSection = Math.min(
			ingIdx  >= 0 ? ingIdx  : Infinity,
			prepIdx >= 0 ? prepIdx : Infinity
		);
		const before = lines.slice(0, firstSection);
		title       = before[0] ?? '';
		description = before.slice(1).join(' ').trim();

		if (ingIdx >= 0 && prepIdx > ingIdx) {
			ingredientLines = lines.slice(ingIdx + 1, prepIdx);
			stepLines       = lines.slice(prepIdx + 1);
		} else if (ingIdx >= 0 && prepIdx < 0) {
			ingredientLines = lines.slice(ingIdx + 1);
		} else if (prepIdx >= 0 && ingIdx < 0) {
			stepLines = lines.slice(prepIdx + 1);
		} else {
			// ingIdx > prepIdx — unusual order
			stepLines       = lines.slice(prepIdx + 1, ingIdx);
			ingredientLines = lines.slice(ingIdx + 1);
		}
	} else {
		// No explicit sections — first line is title, rest are steps
		title     = lines[0] ?? '';
		stepLines = lines.slice(1);
	}

	const ingredients = ingredientLines
		.filter((l) => !SEPARATOR.test(l))
		.map((l) => l.replace(/^[-•*]\s*/, '').trim())
		.filter(Boolean);

	const steps = stepLines
		.filter((l) => !SEPARATOR.test(l))
		.map((l) => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-•*]\s*/, '').trim())
		.filter(Boolean);

	return json({ title, description, ingredients, steps });
};
