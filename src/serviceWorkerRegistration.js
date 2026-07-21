export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("/service-worker.js");
        console.log("✅ SW registered", reg);

        navigator.serviceWorker.ready.then(() => {
          console.log("✅ SW ready");
        });
      } catch (err) {
        console.error("❌ SW failed:", err);
      }
    });
  }
}