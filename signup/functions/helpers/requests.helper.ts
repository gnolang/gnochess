import { Response } from "express";

class RequestHelper {
  static sendSuccess(response: Response, payload: any) {
    return response.status(200).json(payload).end();
  }

  static sendError(response: Response, code: number, message: any) {
    return response.status(code).json(message).end();
  }
}

export default RequestHelper;
