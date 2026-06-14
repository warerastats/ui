<script lang="ts">
    let {children} = $props();
</script>

<div>
    {@render children()}
</div>

<style>
    div {
        max-width: 1096px;
        width: 100%;
        margin: 0 auto;
    }
</style>
