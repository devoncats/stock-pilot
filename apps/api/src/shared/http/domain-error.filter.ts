import {
    type ArgumentsHost,
    Catch,
    type ExceptionFilter,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import type { Response } from "express";
import {
    DomainError,
    DomainErrorKind,
} from "@/shared/domain/errors/domain.error.js";

const STATUS_BY_KIND: Record<DomainErrorKind, HttpStatus> = {
    [DomainErrorKind.INVALID_OPERATION]: HttpStatus.BAD_REQUEST,
    [DomainErrorKind.CONFLICT]: HttpStatus.CONFLICT,
    [DomainErrorKind.NOT_FOUND]: HttpStatus.NOT_FOUND,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
    private readonly logger = new Logger(DomainErrorFilter.name);

    catch(exception: DomainError, host: ArgumentsHost) {
        const status = STATUS_BY_KIND[exception.kind];

        this.logger.warn(
            `[DomainErrorFilter]: ${exception.code}: ${exception.message}`,
        );

        host.switchToHttp().getResponse<Response>().status(status).json({
            statusCode: status,
            code: exception.code,
            message: exception.message,
        });
    }
}
