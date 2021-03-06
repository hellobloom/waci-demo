const ngrok = require("ngrok");
const { spawn } = require("child_process");

console.log("starting ngrok");
(async function () {
  try {
    const url = await ngrok.connect({
      addr: 3001,
      host_header: "rewrite",
    });

    console.log(`ngrok url: ${url}`);
    const dev = spawn("./bin/dev", {
      env: {
        ...process.env,
        NGROK_HOST: url,
      },
      shell: true,
    });
    dev.on("error", (data) => console.log(`Error: ${data}`));
    dev.stdout.on("data", (data) => console.log(`Stdout: ${data}`));
    dev.stderr.on("data", (data) => console.log(`Stderr: ${data}`));
  } catch (error) {
    console.log(`Error while starting ngrok: ${error}`);
  }
})();
