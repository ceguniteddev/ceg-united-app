import AppError from "@/error/AppError";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export const badRequest = ({
  message = "Bad Request",
  errors,
}: {
  message?: string;
  errors: string | string[] | object | null;
}) => {
  let formattedErrors: unknown[] = [];

  if (typeof errors === "string") {
    formattedErrors.push(errors);
  } else if (Array.isArray(errors)) {
    formattedErrors = errors;
  } else if (typeof errors === "object" && errors !== null) {
    formattedErrors = Object.values(errors).flat();
  }

  return NextResponse.json(
    {
      message,
      errors: formattedErrors,
    },
    { status: 400 }
  );
};

export const unauthorized = (message = "Unauthorized") => {
  return NextResponse.json({ message }, { status: 401 });
};

export const forbidden = (message = "Forbidden") => {
  return NextResponse.json({ message }, { status: 403 });
};

export const notFound = (message = "Not Found") => {
  return NextResponse.json({ message }, { status: 404 });
};

export const notAllowed = (message = "Method Not Allowed") => {
  return NextResponse.json({ message }, { status: 405 });
};

export const tooManyRequests = (message = "Too Many Requests") => {
  return NextResponse.json({ message }, { status: 429 });
};

export const internalServerError = (message = "Internal Server Error") => {
  return NextResponse.json({ message }, { status: 500 });
};

export const isJsonContentType = (request: NextRequest): boolean => {
  const contentType = request.headers.get("content-type") || "";
  return contentType.includes("application/json");
};

export const ensureJsonContentType = (
  request: NextRequest
): NextResponse | null => {
  if (!isJsonContentType(request)) {
    return badRequest({ errors: "Content-Type must be application/json" });
  }
  return null;
};

export const isFormDataContentType = (request: NextRequest): boolean => {
  const contentType = request.headers.get("content-type") || "";
  return (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  );
};

export const ensureFormDataContentType = (
  request: NextRequest
): NextResponse | null => {
  if (!isFormDataContentType(request)) {
    return badRequest({
      errors:
        "Content-Type must be multipart/form-data or application/x-www-form-urlencoded",
    });
  }
  return null;
};

export const handleApiError = (error: any, customMessage?: string) => {
  if (error instanceof AppError) {
    console.error(customMessage ? `${customMessage}:` : "Error: ", error);
    return NextResponse.json(error.message, { status: error.statusCode });
  }

  console.error(
    customMessage
      ? `${customMessage}: Unexpected error: `
      : "Unexpected error: ",
    error
  );
  return internalServerError();
};

export const getMessage = (error: z.ZodError) => {
  const allMessages: string[] = [];

  // Helper function to recursively extract errors with field path
  const extractErrors = (obj: any, fieldPath = "") => {
    if (obj.errors && Array.isArray(obj.errors) && obj.errors.length > 0) {
      obj.errors.forEach((error: string) => {
        const message = fieldPath ? `${fieldPath} is ${error}` : error;
        allMessages.push(message);
      });
    }
    if (obj.properties && typeof obj.properties === "object") {
      Object.entries(obj.properties).forEach(([key, prop]: [string, any]) => {
        const newPath = fieldPath ? `${fieldPath}.${key}` : key;
        extractErrors(prop, newPath);
      });
    }
  };

  const flat = z.treeifyError(error);
  extractErrors(flat);

  return allMessages.length > 0 ? allMessages : ["Invalid request body"];
};
