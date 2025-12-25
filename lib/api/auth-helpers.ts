import { NextRequest } from "next/server";
import { verifyRequest, SessionNotFoundError } from "@/lib/shopify/verify";

/**
 * Extract shop domain from various sources in the request
 */
export function extractShopFromRequest(req: NextRequest): string | null {
  // Priority order for shop extraction:
  // 1. Authorization header (Bearer token with session)
  // 2. Query parameter (?shop=)
  // 3. Webhook headers (x-shopify-shop-domain)
  // 4. Custom headers
  
  // Try Authorization header first (for authenticated requests)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // For authenticated requests, we need to decode the session to get shop
    // This will be handled by verifyRequest
    return "AUTH_HEADER_PRESENT"; // Special marker for auth header
  }

  // Try query parameter
  const url = new URL(req.url);
  const queryShop = url.searchParams.get("shop");
  if (queryShop) {
    return queryShop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  // Try webhook headers
  const webhookShop = req.headers.get("x-shopify-shop-domain");
  if (webhookShop) {
    return webhookShop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  // Try custom header
  const customShop = req.headers.get("x-shop-domain");
  if (customShop) {
    return customShop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  return null;
}

/**
 * Verify shop access with proper authentication
 * Handles both authenticated and webhook scenarios
 */
export async function verifyShopAccess(req: NextRequest): Promise<{
  shop: string;
  session?: any;
  isAuthenticated: boolean;
}> {
  const extractedShop = extractShopFromRequest(req);
  
  // If we have an auth header, verify the session
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const sessionData = await verifyRequest(req, true); // true for online access
      return {
        shop: sessionData.shop,
        session: sessionData.session,
        isAuthenticated: true,
      };
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw new Error("Authentication required. Please log in to your Shopify store.");
      }
      throw new Error("Invalid session token.");
    }
  }

  // For non-authenticated requests, extract shop from other sources
  if (extractedShop && extractedShop !== "AUTH_HEADER_PRESENT") {
    return {
      shop: extractedShop,
      isAuthenticated: false,
    };
  }

  // No shop found
  throw new Error("Shop domain not provided. Include ?shop=your-store.myshopify.com or authentication token.");
}

/**
 * Standardized error responses for shop-related issues
 */
export class ShopAccessError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = "ShopAccessError";
    this.statusCode = statusCode;
  }
}

/**
 * Create standardized shop validation middleware
 */
export function createShopValidator(requireAuth: boolean = true) {
  return async (req: NextRequest) => {
    try {
      const result = await verifyShopAccess(req);
      
      // For authenticated requests, ensure we have a valid session
      if (requireAuth && !result.isAuthenticated) {
        throw new ShopAccessError("Authentication required for this endpoint.", 401);
      }

      return result;
    } catch (error) {
      if (error instanceof ShopAccessError) {
        throw error;
      }
      
      // Convert other errors to shop access errors
      const statusCode = error instanceof Error && 
        error.message.includes("Authentication") ? 401 : 400;
      
      throw new ShopAccessError(
        error instanceof Error ? error.message : "Shop validation failed",
        statusCode
      );
    }
  };
}

/**
 * Validate that a shop domain is properly formatted
 */
export function validateShopDomain(shop: string): boolean {
  // Shopify shop domains should match: store-name.myshopify.com or store-name.shopify.com
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(myshopify\.com|shopify\.com)$/;
  return shopRegex.test(shop);
}

/**
 * Normalize shop domain (remove protocol, trailing slash)
 */
export function normalizeShopDomain(shop: string): string {
  return shop
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}
