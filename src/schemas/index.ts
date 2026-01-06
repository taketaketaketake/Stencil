// Central schema exports and validation utilities

export * from './auth.js';
export * from './listings.js';
export * from './variants.js';

// Common error response schemas
export const errorResponseSchema = {
  400: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' },
      details: { type: 'object' }
    },
    required: ['error']
  },
  401: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['error']
  },
  403: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['error']
  },
  404: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['error']
  },
  500: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['error']
  }
} as const;

// Common success response schemas
export const successResponseSchema = {
  200: {
    type: 'object',
    properties: {
      message: { type: 'string' }
    }
  }
} as const;

// Pagination schema for future use
export const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { 
      type: 'integer', 
      minimum: 1, 
      default: 1,
      description: 'Page number (1-based)' 
    },
    limit: { 
      type: 'integer', 
      minimum: 1, 
      maximum: 100, 
      default: 20,
      description: 'Items per page (max 100)' 
    },
    sort: { 
      type: 'string',
      enum: ['created', 'updated', 'name', 'price'],
      default: 'created',
      description: 'Sort field'
    },
    order: { 
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc',
      description: 'Sort order'
    }
  },
  additionalProperties: false
} as const;

// Validation helpers
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: 'created' | 'updated' | 'name' | 'price';
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Schema validation utility for Fastify
 * Combines request/response schemas for a route
 */
export function createRouteSchema<
  TBody = any,
  TParams = any,
  TQuery = any,
  TResponse = any
>(schema: {
  body?: TBody;
  params?: TParams;
  querystring?: TQuery;
  response?: TResponse;
}) {
  return schema;
}

/**
 * Helper to merge common error responses with route-specific ones
 */
export function withErrorResponses<T extends Record<number, any>>(
  responses: T
): T & typeof errorResponseSchema {
  return {
    ...errorResponseSchema,
    ...responses
  };
}