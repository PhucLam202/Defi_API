import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { ErrorCode } from "./ErrorCode";
import { ErrorMessages } from "./ErrorMessages";
import { AppError } from "./AppError";
import { logger } from "../../utils/logger";

declare module 'express' {
  interface Request {
    correlationId?: string;
  }
}

interface ResponseMethods {
    successResponse(httpCode: StatusCodes, data: object): void;
    errorResponse(httpCode: StatusCodes, errCode: ErrorCode, data: object): void;
    responseAppError(e: AppError): void;
    response200(data: object): void;
    response201(data: object): void;
    response204(data: object): void;
    response400(errCode: ErrorCode, data: object): void;
    response401(errCode: ErrorCode, data: object): void;
    response403(errCode: ErrorCode, data: object): void;
    response404(errCode: ErrorCode, data: object): void;
    response500(errCode: ErrorCode, data: object): void;
    response429(errCode: ErrorCode, data: object): void;
}

export class CustomExpress implements ResponseMethods {
    req: Request;
    res: Response;
    next: NextFunction;

    constructor(req: Request, res: Response, next: NextFunction) {
        this.req = req;
        this.res = res;
        this.next = next;
    }

    successResponse(httpCode: StatusCodes, data: object): void {
        let resp: CustomResponse = {
            data,
            msg: ReasonPhrases.OK,
            code: httpCode,
        }
        
        logger.info('Success response', {
            statusCode: httpCode,
            url: this.req.url,
            method: this.req.method,
            userAgent: this.req.get('User-Agent'),
            correlationId: this.req.correlationId
        });

        this.res.status(httpCode).json(resp);
        return;
    }

    errorResponse(httpCode: StatusCodes, errCode: ErrorCode, data: object): void {
        const logData = {
            statusCode: httpCode,
            errCode: errCode,
            message: ErrorMessages[errCode],
            url: this.req.url,
            method: this.req.method,
            userAgent: this.req.get('User-Agent'),
            ip: this.req.ip || this.req.socket.remoteAddress,
            correlationId: this.req.correlationId
        };

        if (httpCode >= 500) {
            logger.error('Server error', logData);
        } else if (httpCode >= 400) {
            logger.warn('Client error', logData);
        }

        let resp: CustomResponse = {
            data: data,
            msg: ErrorMessages[errCode],
            code: errCode,
        }

        this.res.status(httpCode).json(resp);
        return;
    }

    responseAppError(e: AppError): void {
        let data: { message: string, details?: string } = {
            message: e.msg,
        }
        
        // Only include sanitized error details in development mode
        if (process.env.NODE_ENV === 'development' && e.root) {
            data.details = e.root.message;
        }
        
        this.errorResponse(e.statusCode, e.errCode as ErrorCode, data);
        return;
    }

    response200(data: object): void {
        this.successResponse(StatusCodes.OK, data);
        return;
    }

    response201(data: object): void {
        this.successResponse(StatusCodes.CREATED, data);
        return;
    }

    response204(data: object): void {
        this.successResponse(StatusCodes.NO_CONTENT, data);
        return;
    }

    response400(errCode: ErrorCode, data: object): void {
        this.errorResponse(StatusCodes.BAD_REQUEST, errCode, data);
        return;
    }

    response401(errCode: ErrorCode, data: object): void {
        this.errorResponse(StatusCodes.UNAUTHORIZED, errCode, data);
        return;
    }

    response403(errCode: ErrorCode, data: object): void {
        this.errorResponse(StatusCodes.FORBIDDEN, errCode, data);
        return;
    }

    response404(errCode: ErrorCode, data: object): void {
        this.errorResponse(StatusCodes.NOT_FOUND, errCode, data);
        return;
    }

    response500(errCode: ErrorCode, data: object): void {
        this.errorResponse(StatusCodes.INTERNAL_SERVER_ERROR, errCode, data);
        return;
    }

    response429(errCode: ErrorCode, data: object): void {
        this.errorResponse(StatusCodes.TOO_MANY_REQUESTS, errCode, data);
        return;
    }
}

export interface CustomResponse {
    data: object;
    msg: string;
    code: number;
}

export interface CustomResponseT<T> {
    data: T;
    msg: string;
    code: number;
}