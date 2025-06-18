// src/utils/apiResponse.js
// 統一APIレスポンス形式

import { HTTP_STATUS } from '@/constants';

export const createSuccessResponse = (data = null, message = null) => {
  const response = { success: true };
  if (data !== null) response.data = data;
  if (message) response.message = message;
  return Response.json(response);
};

export const createErrorResponse = (message, status = HTTP_STATUS.BAD_REQUEST, details = null) => {
  const response = { 
    success: false, 
    error: message,
    timestamp: new Date().toISOString()
  };
  if (details) response.details = details;
  return Response.json(response, { status });
};

export const createValidationErrorResponse = (errors) => {
  return createErrorResponse(
    'Validation failed', 
    HTTP_STATUS.BAD_REQUEST, 
    { validationErrors: errors }
  );
};