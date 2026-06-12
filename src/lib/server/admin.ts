import { env } from '$env/dynamic/private';

export function isAdmin(address: string | null | undefined): boolean {
	if (!address) return false;
	const admins = (env.ADMIN_ADDRESSES ?? '').split(',').map(a => a.trim().toLowerCase());
	return admins.includes(address.toLowerCase());
}
