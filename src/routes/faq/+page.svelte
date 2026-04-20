<script>
    import Nav from "$lib/Nav.svelte"
    import {marked} from "marked"
    import faq from "./faq.md?raw"
    let html = marked.parse(faq)
    import "./mdhandler.css"
</script>
<Nav/>
<div class="fixed -z-10 w-screen h-screen top-0">
	<div class="img absolute -z-20 w-full h-full"></div>
	<div class="ovr h-full w-screen -z-10"></div>
</div>
<div class="flex flex-col items-center justify-center text-white ">
<div class="inner-cont w-1/2 mt-50">
    {@html html}
</div>
</div>
<style>
    .img {
		background-image: url("/bg2.webp");
		background-size: cover;
		background-position: center;
	}
	.ovr {
		background: linear-gradient(
			#000000a9,
			#000000a9,
			#000000a9,
			#000000a9,
			#000000
		);
	}

</style>