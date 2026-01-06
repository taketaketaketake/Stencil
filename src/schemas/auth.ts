// Authentication request/response schemas for Fastify

export const loginRequestSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { 
      type: 'string', 
      format: 'email',
      description: 'Vendor email address'
    },
    password: { 
      type: 'string', 
      minLength: 1,
      description: 'Vendor password'
    }
  },
  additionalProperties: false
} as const;

export const loginResponseSchema = {
  200: {
    type: 'object',
    properties: {
      token: { 
        type: 'string',
        description: 'JWT authentication token'
      }
    },
    required: ['token']
  },
  400: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  },
  401: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  }
} as const;

export const registerRequestSchema = {
  type: 'object',
  required: ['name', 'email', 'password'],
  properties: {
    name: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: 'Vendor/business name'
    },
    email: { 
      type: 'string', 
      format: 'email',
      description: 'Vendor email address'
    },
    password: { 
      type: 'string', 
      minLength: 6,
      maxLength: 100,
      description: 'Vendor password (minimum 6 characters)'
    }
  },
  additionalProperties: false
} as const;

export const registerResponseSchema = {
  201: {
    type: 'object',
    properties: {
      message: { 
        type: 'string',
        description: 'Success message'
      }
    }
  },
  400: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  },
  409: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  }
} as const;

// TypeScript types derived from schemas
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface AuthErrorResponse {
  error: string;
}