import { ContentfulStatusCode } from "hono/utils/http-status"

export class DomainError extends Error {
    readonly statusCode: ContentfulStatusCode
    readonly type: string

    constructor(message: string, statusCode: ContentfulStatusCode = 400, type = "DOMAIN_ERROR") {
        super(message)
        this.statusCode = statusCode
        this.type = type
    }
}

export class ConflictError extends DomainError {
    constructor(message: string) {
        super(message, 409, "CONFLICT")
    }
}

export class NotFoundError extends DomainError {
    constructor(message: string) {
        super(message, 404, "NOT_FOUND")
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message: string) {
        super(message, 401, "UNAUTHORIZED")
    }
}
export class BadRequestError extends DomainError {
    constructor(message: string) {
        super(message, 400, "BAD_REQUEST")
    }
}

export class InternalServerError extends DomainError {
    constructor(message: string) {
        super(message, 500, "INTERNAL_SERVER_ERROR")
    }
}

export class ForbiddenError extends DomainError {
    constructor(message: string) {
        super(message, 403, "FORBIDDEN")
    }
}

export class ValidationError extends DomainError {
    constructor(message: string) {
        super(message, 422, "VALIDATION_ERROR")
    }
}

export class ServiceUnavailableError extends DomainError {
    constructor(message: string) {
        super(message, 503, "SERVICE_UNAVAILABLE")
    }
}

export class TimeoutError extends DomainError {
    constructor(message: string) {
        super(message, 504, "TIMEOUT_ERROR")
    }
}

export class ConflictResourceError extends ConflictError {
    constructor(resourceName: string) {
        super(`The resource ${resourceName} already exists.`)
    }
}

export class ConflictEmailError extends ConflictError {
    constructor(email: string) {
        super(`The user with Email ${email} already exists.`)
    }
}

export class ResourceNotFoundError extends NotFoundError {
    constructor(resourceName: string) {
        super(`The resource ${resourceName} was not found.`)
    }
}

export class InvalidCredentialsError extends UnauthorizedError {
    constructor() {
        super(`Invalid credentials provided.`)
    }
}

export class AccessDeniedError extends ForbiddenError {
    constructor() {
        super(`Access to the requested resource is denied.`)
    }
}