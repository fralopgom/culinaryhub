// Each ID verified against images.unsplash.com CDN
const FOOD_PHOTOS = [
	'1504674900247-0877df9cc836', // colorful overhead spread
	'1565299624946-b28f40a0ae38', // neapolitan pizza closeup
	'1567620905732-2d1ec7ab7445', // pasta, warm amber light
	'1546069901-ba9599a7e63c',    // vibrant grain bowl
	'1547592180-85f173990554',    // rustic golden bread
	'1543339308-43e59d6b73a6',    // hands shaping dough
	'1512621776951-a57141f2eefd', // Buddha bowl, daylight
	'1455619452474-a2175cc2d3e1', // spices flatlay, warm tones
	'1498654896293-37aaa4cdbf28', // kitchen prep, natural light
	'1414235077428-338989a2e8c0', // elegant plating, dark table
	'1476224203421-74177f8d12cd', // dark moody dessert
	'1490645935967-10de6ba17061', // salad, summer colours
	'1484723091739-30b0bd76b342', // kitchen window, morning light
	'1493770348161-369560ae357d', // street food market
	'1481931098730-318b6f776db0', // fish tacos, vibrant
	'1482049016688-2d3e1b311543', // minimalist avocado toast
];

export function recipePhoto(seed: string, w = 480, h = 300): string {
	const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
	const id   = FOOD_PHOTOS[hash % FOOD_PHOTOS.length];
	return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

// Hero — kitchen with morning light filtering through window
export const HERO_PHOTO = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&h=1080&q=85';

// Form section sidebars
export const FORM_PHOTOS = {
	soul:        'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&h=1000&q=80', // hands on dough
	ingredients: 'https://images.unsplash.com/photo-1455619452474-a2175cc2d3e1?auto=format&fit=crop&w=800&h=600&q=80',  // spices flatlay
	steps:       'https://images.unsplash.com/photo-1498654896293-37aaa4cdbf28?auto=format&fit=crop&w=800&h=600&q=80',  // kitchen prep
};
