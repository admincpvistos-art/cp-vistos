type PostalParts = {
  postalStreet?: string | null;
  postalAddressNumber?: string | null;
  postalComplement?: string | null;
  postalDistrict?: string | null;
  postalCity?: string | null;
  postalState?: string | null;
  postalCep?: string | null;
  postalCountry?: string | null;
};

/** Monta string legada para `otherPostalAddress` a partir dos campos estruturados. */
export function buildLegacyPostalAddress(parts: PostalParts) {
  const street = [parts.postalStreet, parts.postalAddressNumber, parts.postalComplement].filter(Boolean).join(", ");
  const locality = [parts.postalDistrict, parts.postalCity, parts.postalState, parts.postalCep, parts.postalCountry]
    .filter(Boolean)
    .join(" — ");
  return [street, locality].filter(Boolean).join(" | ");
}

export type { PostalParts };
