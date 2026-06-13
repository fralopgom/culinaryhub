// Curated food photography — warm, cultural, inviting
const FOOD_PHOTOS = [
	'1504674900247-0877df9cc836', // colourful overhead spread
	'1567620905732-2d1ec7ab7445', // pasta, warm light
	'1546069901-ba9599a7e63c',    // vibrant grain bowl
	'1565299624946-b28f40a0ae38', // neapolitan pizza
	'1414235077428-338989a2e8c0', // elegant restaurant plating
	'1547592180-85f173990554',    // rustic bread, golden crust
	'1543339308-43e59d6b73a6',    // hands kneading dough
	'1512621776951-a57141f2eefd', // healthy Buddha bowl
	'1455619452474-a2175cc2d3e1', // exotic spices arrangement
	'1498654896293-37aaa4cdbf28', // kitchen preparation scene
	'1476224203421-74177f8d12cd', // dark moody dessert
	'1490645935967-10de6ba17061', // fresh salad, summer
	'1484723091739-30b0bd76b342', // warm kitchen window light
	'1493770348161-369560ae357d', // street food market colours
	'1482049016688-2d3e1b311543', // simple avocado, minimalist
	'1481931098730-318b6f776db0', // fish tacos, vibrant
];

export function recipePhoto(seed: string, w = 480, h = 300): string {
	const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
	const id = FOOD_PHOTOS[hash % FOOD_PHOTOS.length];
	return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

export const HERO_PHOTO =
	'https://images.unsplash.com/photo-1556909172-b5e21e8e2ed3?auto=format&fit=crop&w=1920&h=1080&q=85';
