<script>
  import Nav from "$lib/Nav.svelte";
</script>

<Nav />
<div
  class="absolute center-ovr w-screen h-screen flex items-center justify-center top-0"
>
  <div class="alchemy flex items-center justify-center pb-10">
    <div class="second-cont w-3xl">
      <h1 class=" text-6xl flex items-center gap-10 font-bold">
        <img src="./Alchemist.webp" alt="" class="logo size-16" />
        <span class="font alchemizefont">Alchemize</span>
      </h1>
      <div class="description">
        <div class="flex justify-center w-full flex-col">
          <p
            class="text-gray-300 text-justify mt-1 text-lg gap-2 flex flex-col"
          >
            <span class="text-3xl font-bold"
              >3 Themes, 3 Currencies and a Dynamic Shop</span
            >
            <span class="text-xl">Under Draft | Hackclub Ages 13-18</span>
          </p>
          <div class="form flex">
            <input
              type="text"
              placeholder="Enter your Email"
              class="h-10 w-100 border border-red-500 mt-5 rounded-l-md text-gray-400 pl-2 outline-none"
            />
            <button class="h-10 w-28 bg-red-500 text-gray-200 font-bold border border-red-600 mt-5 rounded-r-md hover:bg-red-500 ml-1 text-md">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="absolute -z-10 w-screen h-screen">
  <div class="img absolute -z-20 w-full h-full"></div>
  <div class="ovr h-full w-screen -z-10"></div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Saira+Stencil:ital,wght@0,100..900;1,100..900&display=swap");
  .img {
    background-image: url("./bg2.webp");
    background-size: cover;
    background-position: center;
  }
  .ovr {
    background: rgba(0, 0, 0, 0.664);
  }
  .alchemy {
    height: 100vh;
    width: 50vw;
  }
  .alchemizefont {
    font-family: "Saira Stencil", cursive;
    color: hsl(0, 100%, 59%);
  }
</style>
