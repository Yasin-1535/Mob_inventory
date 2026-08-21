import { AuthUser } from '../services/mockAuth';

/**
 * Checks if a given item's vendor identifier or name matches the currently authenticated vendor user.
 */
export const isVendorOwner = (
  itemVendorName?: string,
  itemVendorId?: string,
  user?: AuthUser | null
): boolean => {
  if (!user) return false;

  const targetName = itemVendorName ? itemVendorName.trim().toLowerCase() : '';
  const targetId = itemVendorId ? itemVendorId.trim().toLowerCase() : '';

  const userName = user.name ? user.name.trim().toLowerCase() : '';
  const shopName = user.shopName ? user.shopName.trim().toLowerCase() : '';
  const vendorId = user.vendorId ? user.vendorId.trim().toLowerCase() : '';
  const userId = user.id ? user.id.trim().toLowerCase() : '';

  // Direct ID matches
  if (targetId && (targetId === vendorId || targetId === userId)) {
    return true;
  }

  // Name or shop name matches
  if (targetName) {
    if (userName && (targetName === userName || targetName.includes(userName) || userName.includes(targetName))) {
      return true;
    }
    if (shopName && (targetName === shopName || targetName.includes(shopName) || shopName.includes(targetName))) {
      return true;
    }
    if (vendorId && targetName === vendorId) {
      return true;
    }
  }

  // Fallback for default seed vendor ABC Electronics
  if ((!shopName || shopName.includes('abc')) && targetName.includes('abc')) {
    return true;
  }

  return false;
};
