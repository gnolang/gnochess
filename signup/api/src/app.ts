import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from "body-parser";
import * as http from "http";
import { ApplicationEnv, CONFIG } from "./config";
import { subscribeRouter } from "./routes/routers";
import errorhandler from "errorhandler";
import cors from "cors";

const { NODE_PORT, NODE_HOST, NODE_ENV } = CONFIG;
const isProduction = NODE_ENV === ApplicationEnv.PRODUCTION;

const app = express();

app.use(cors());

app.set("port", NODE_PORT);
app.set("host", NODE_HOST);

// Express Config
const rawBodyBuffer = (
  req: http.IncomingMessage,
  _: http.ServerResponse,
  buf: Buffer,
  encoding: BufferEncoding,
) => {
  if (buf && buf.length) {
    // @ts-ignore
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

if (!isProduction) {
  app.use(errorhandler());
}

// CORS Setup
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Define API routes //
app.use("/api/subscribe", subscribeRouter);

// Catch 404s
app.use("*", (request: Request, response: Response) => {
  return response.status(404).json({ message: "Not Found" });
});

// Set up the development error handler
if (!isProduction) {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err.stack);

    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err,
      },
    });
  });
}

// Set up the production error handler
app.use((err: any, req: Request, res: Response, _: NextFunction) => {
  res.status(err.status || 500);
  res.json({
    errors: {
      message: err.message,
      error: {},
    },
  });
});

export default app;
