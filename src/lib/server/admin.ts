export function isAdmin(user: App.Locals['user']): boolean {
	return user?.is_admin ?? false;
}
