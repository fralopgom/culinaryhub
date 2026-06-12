<script lang="ts">
	let { score, tier = 0 }: { score: number; tier?: number } = $props();

	const label = $derived(
		score >= 500 ? '★★★' :
		score >= 100 ? '★★' :
		score > 0    ? '★' : ''
	);
</script>

<span title="Prestige {score}">{label} {score}</span>
