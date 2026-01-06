// Listings request/response schemas for Fastify

export const variantSchema = {
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

export const listingRequestSchema = {
  type: 'object',
  required: ['name', 'variants'],
  properties: {
    name: { 
      type: 'string', 
      minLength: 1,
      maxLength: 200,
      description: 'Product/listing name'
    },
    description: { 
      type: 'string',
      maxLength: 2000,
      description: 'Product description (optional)'
    },
    category: { 
      type: 'string',
      maxLength: 100,
      description: 'Product category (optional)'
    },
    subCategory: { 
      type: 'string',
      maxLength: 100,
      description: 'Product sub-category (optional)'
    },
    tags: { 
      type: 'string',
      maxLength: 500,
      description: 'Comma-separated tags (optional)'
    },
    variants: { 
      type: 'array', 
      items: variantSchema,
      minItems: 1,
      maxItems: 50,
      description: 'Product variants (at least one required)'
    }
  },
  additionalProperties: false
} as const;

export const listingResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string' },
    subCategory: { type: 'string' },
    tags: { type: 'string' },
    status: { type: 'string' },
    vendorId: { type: 'integer' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    isFeatured: { type: 'boolean' },
    isActive: { type: 'boolean' },
    variants: { 
      type: 'array',
      items: {
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
      }
    }
  }
} as const;

export const listingParamsSchema = {
  type: 'object',
  properties: {
    id: { 
      type: 'string', 
      pattern: '^[0-9]+$',
      description: 'Listing ID'
    }
  },
  required: ['id']
} as const;

export const createListingResponseSchema = {
  201: {
    type: 'object',
    properties: {
      id: { 
        type: 'integer',
        description: 'Created listing ID'
      }
    },
    required: ['id']
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

export const updateListingResponseSchema = {
  200: {
    type: 'object',
    properties: {
      id: { 
        type: 'integer',
        description: 'Updated listing ID'
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

export const deleteListingResponseSchema = {
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
export interface VariantData {
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  images?: string[];
}

export interface ListingRequest {
  name: string;
  description?: string;
  category?: string;
  subCategory?: string;
  tags?: string;
  variants: VariantData[];
}

export interface ListingResponse {
  id: number;
  name: string;
  description?: string;
  category?: string;
  subCategory?: string;
  tags?: string;
  status: string;
  vendorId: number;
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
  isActive: boolean;
  variants: Array<{
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
  }>;
}