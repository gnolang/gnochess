import router from "./app";
import { createServer, Server } from "http";

const server: Server = createServer(router);

server.listen(router.get("port"), router.get("host"), async () => {
  console.log(`Server started at ${router.get("host")}:${router.get("port")}`);

  process.on("SIGINT", () => {
    process.exit();
  });

  console.log("Press CTRL-C to stop\n");
});

export default server;
