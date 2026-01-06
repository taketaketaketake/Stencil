// Variants request/response schemas for Fastify

export const variantRequestSchema = {
  type: 'object',
  required: ['name', 'price', 'stock', 'attributes'],
  properties: {
    name: { 
      type: 'string', 
      minLength: 1,
      maxLength: 100,
      description: 'Variant name (e.g., "Red / Medium")'
    },
    sku: { 
      type: 'string',
      maxLength: 50,
      description: 'Stock Keeping Unit (optional)'
    },
    price: { 
      type: 'number', 
      minimum: 0,
      multipleOf: 0.01,
      description: 'Price in USD'
    },
    stock: { 
      type: 'integer', 
      minimum: 0,
      description: 'Available inventory count'
    },
    attributes: { 
      type: 'object',
      additionalProperties: { type: 'string' },
      description: 'Key-value pairs for variant attributes (color, size, etc.)'
    },
    images: { 
      type: 'array', 
      items: { 
        type: 'string', 
        format: 'uri' 
      },
      description: 'Array of image URLs (optional)'
    }
  },
  additionalProperties: false
} as const;

export const addVariantsRequestSchema = {
  type: 'object',
  required: ['listingId', 'variants'],
  properties: {
    listingId: { 
      type: 'integer', 
      minimum: 1,
      description: 'ID of the listing to add variants to'
    },
    variants: { 
      type: 'array', 
      items: variantRequestSchema,
      minItems: 1,
      maxItems: 20,
      description: 'Array of variants to add'
    }
  },
  additionalProperties: false
} as const;

export const variantParamsSchema = {
  type: 'object',
  properties: {
    id: { 
      type: 'string', 
      pattern: '^[0-9]+$',
      description: 'Variant ID'
    }
  },
  required: ['id']
} as const;

export const variantResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    listingId: { type: 'integer' },
    name: { type: 'string' },
    sku: { type: 'string' },
    price: { type: 'number' },
    stock: { type: 'integer' },
    attributes: { type: 'object' },
    images: { type: 'array' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  }
} as const;

export const createVariantsResponseSchema = {
  201: {
    type: 'array',
    items: variantResponseSchema,
    description: 'Array of created variants'
  },
  400: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  },
  403: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  },
  404: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  }
} as const;

export const updateVariantResponseSchema = {
  200: {
    type: 'object',
    properties: {
      message: { 
        type: 'string',
        description: 'Success message'
      },
      id: { 
        type: 'integer',
        description: 'Updated variant ID'
      }
    }
  },
  400: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  },
  403: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  },
  404: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  }
} as const;

export const deleteVariantResponseSchema = {
  200: {
    type: 'object',
    properties: {
      message: { 
        type: 'string',
        description: 'Success message'
      }
    }
  },
  403: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  },
  404: {
    type: 'object',
    properties: {
      error: { type: 'string' }
    }
  }
} as const;

// TypeScript interfaces
export interface VariantRequest {
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  images?: string[];
}

export interface AddVariantsRequest {
  listingId: number;
  variants: VariantRequest[];
}

export interface VariantResponse {
  id: number;
  listingId: number;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  images?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVariantResponse {
  message: string;
  id: number;
}

export interface DeleteVariantResponse {
  message: string;
}