import type { Request, Response } from 'express';

export type ApiHandler = (req: any, res: any) => void | Promise<unknown>;

export function asExpress(handler: ApiHandler) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[api adapter]', err);
      if (!res.headersSent) {
        res.status(500).json({
          ok: false,
          error: 'Internal server error',
          code: 'INTERNAL',
        });
      }
    }
  };
}
