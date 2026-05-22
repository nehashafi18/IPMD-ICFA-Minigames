class HTTPException extends Error {
  statusCode: number;
  reason: string;

  constructor(
    statusCode: number,
    reason: string,
    message: string
  ) {
    super(message);

    this.statusCode = statusCode;
    this.reason = reason;

    Error.captureStackTrace?.(
      this,
      this.constructor
    );
  }
}

class AIProviderException extends HTTPException {
  provider: string;

  constructor(
    provider: string,
    statusCode: number,
    reason: string,
    message: string
  ) {
    super(statusCode, reason, message);
    this.provider = provider;
  }
}

function createHTTPException(
  statusCode: number,
  reason: string,
  defaultMessage: string
) {
  return class extends HTTPException {
    constructor(message: string = defaultMessage) {
      super(statusCode, reason, message);
    }
  };
}

const AlreadyExistsException = createHTTPException(409, "AlreadyExists", "Already exists");
const ConflictException = createHTTPException(409, "Conflict", "Conflict with existing resource");
const NotFoundException = createHTTPException(404, "NotFound", "Not found");
const UnauthorizedException = createHTTPException(401, "Unauthorized", "Unauthorized");
const ForbiddenException = createHTTPException(403, "Forbidden", "Forbidden");
const InvalidException = createHTTPException(422, "Invalid", "Invalid input");
const BadRequestException = createHTTPException(400, "BadRequest", "Bad request");
const InternalServerErrorException = createHTTPException(500, "InternalServerError", "Internal server error");
const ServiceUnavailableException = createHTTPException(503, "ServiceUnavailable", "Service unavailable");
const GatewayTimeoutException = createHTTPException(504, "GatewayTimeout", "Gateway timeout");

type ErrorData = {
  code?: number;
  reason?: string;
  message?: string;
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
  };
};

function normalizeError(
  statusCode: number,
  data?: ErrorData
) {
  if (!data) {
    return {
      code: statusCode,
      reason: "Unknown",
      message: "Unknown error",
    };
  }

  if (
    data.error &&
    typeof data.error === "object"
  ) {
    return {
      code: statusCode,
      reason:
        data.error.type ||
        data.error.code ||
        "AIProviderError",
      message:
        data.error.message ||
        "AI provider error",
    };
  }

  return {
    code: data.code || statusCode,
    reason: data.reason || "Unknown",
    message: data.message || "Unknown error",
  };
}

function raiseErrors(
  response: Response,
  data: ErrorData
): never {
  const statusCode = response.status;
  const error = normalizeError(statusCode, data);

  switch (statusCode) {
    case 404:
      throw new NotFoundException(error.message);
    case 409:
      if (error.reason === "AlreadyExists") {
        throw new AlreadyExistsException(error.message);
      }
      throw new ConflictException(error.message);
    case 401:
      throw new UnauthorizedException(error.message);
    case 403:
      throw new ForbiddenException(error.message);
    case 422:
      throw new InvalidException(error.message);
    case 400:
      throw new BadRequestException(error.message);
    case 500:
      throw new InternalServerErrorException(error.message);
    case 503:
      throw new ServiceUnavailableException(error.message);
    case 504:
      throw new GatewayTimeoutException(error.message);
    default:
      throw new HTTPException(
        statusCode || 500,
        String(error.reason || "Unknown"),
        error.message || "Unknown error"
      );
  }
}

async function raiseIfResponseError(
  response: Response
): Promise<void> {
  if (response.status < 400) {
    return;
  }

  let data: ErrorData;

  try {
    data = await response.json();
  } catch {
    data = {
      code: response.status,
      reason: "Unknown",
      message: await response.text(),
    };
  }

  raiseErrors(response, data);
}

export {
  HTTPException,
  AIProviderException,
  AlreadyExistsException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  InvalidException,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
  GatewayTimeoutException,
  raiseIfResponseError,
};