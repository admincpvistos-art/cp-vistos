import { unstable_cache } from "next/cache";

export type GoogleReviewItem = {
  profileImage: string;
  name: string;
  /** ISO date string (RSC → client safe). */
  date: string;
  grades: number;
  desc: string;
};

export type StarDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

/** Distribuição simulada até a integração ao vivo atualizar o total gradualmente. */
export const FALLBACK_STAR_DISTRIBUTION: StarDistribution = {
  5: 4806,
  4: 31,
  3: 0,
  2: 0,
  1: 0,
};

export function totalFromDistribution(distribution: StarDistribution): number {
  return distribution[1] + distribution[2] + distribution[3] + distribution[4] + distribution[5];
}

export function averageFromDistribution(distribution: StarDistribution): number {
  const total = totalFromDistribution(distribution);
  if (total === 0) return 5;
  const weighted =
    distribution[1] +
    distribution[2] * 2 +
    distribution[3] * 3 +
    distribution[4] * 4 +
    distribution[5] * 5;
  return weighted / total;
}

export type GoogleReviewsPayload = {
  reviews: GoogleReviewItem[];
  rating: number | null;
  ratingLabel: string;
  reviewCount: number | null;
  starDistribution: StarDistribution | null;
  writeReviewUrl: string | null;
  mapsUrl: string | null;
  source: "google" | "fallback";
};

/** Depoimentos estáticos usados quando a API Google não está configurada. */
export const FALLBACK_REVIEWS: GoogleReviewItem[] = [
  {
    profileImage: "/assets/images/testimonial-1.png",
    name: "Claudio Monteiro",
    date: "2026-08-16T12:00:00.000Z",
    grades: 5,
    desc: "Tudo impecável! Do início ao fim. Equipe super atenciosa, cuidadosa e, principalmente, ágil. Meu visto saiu em 1 semana. Já indiquei o serviço para alguns amigos e seguirei indicando.",
  },
  {
    profileImage: "/assets/images/testimonial-2.png",
    name: "Vitoria Barros",
    date: "2026-08-23T12:00:00.000Z",
    grades: 5,
    desc: "Acompanhamento excelente, nos sentimos confiante em cada parte do processo! Super indico, conseguimos emitir e finalizar tudo em 12 dias. 🇺🇸🙏🏻❤️💙",
  },
  {
    profileImage: "/assets/images/testimonial-3.png",
    name: "Tamires Brito",
    date: "2026-07-21T12:00:00.000Z",
    grades: 5,
    desc: "Investimento super válido, uma empresa de confiança, a Camila nos atendeu super bem, sempre solicita a todo tempo esclarecendo todas as nossas dúvidas e,  principalmente nos orientou muito bem desde o princípio ao fim de todo o processo. Graças a Deus, e o trabalho de assessoria dela tivemos a aprovação do visto Americano!🙏🏼😅",
  },
  {
    profileImage: "/assets/images/testimonial-4.png",
    name: "Daniel Vilela",
    date: "2026-06-18T12:00:00.000Z",
    grades: 5,
    desc: "Excelente! A Camila me atendeu super bem, extremamente atenciosa. Foram cerca de 20 dias desde o primeiro contato até estar com o visto em mãos. Muito competente!!",
  },
];

function ratingLabelFromScore(rating: number | null) {
  if (rating == null) return "Excelente";
  if (rating >= 4.5) return "Excelente";
  if (rating >= 4) return "Muito bom";
  if (rating >= 3) return "Bom";
  return "Avaliado";
}

export function buildGoogleWriteReviewUrl(placeId?: string | null) {
  const configured = process.env.GOOGLE_REVIEW_URL?.trim();
  if (configured) return configured;
  const id = placeId?.trim() || process.env.GOOGLE_PLACE_ID?.trim();
  if (!id) return null;
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id)}`;
}

function fallbackPayload(): GoogleReviewsPayload {
  const starDistribution = FALLBACK_STAR_DISTRIBUTION;
  const reviewCount = totalFromDistribution(starDistribution);
  const rating = averageFromDistribution(starDistribution);

  return {
    reviews: FALLBACK_REVIEWS,
    rating,
    ratingLabel: ratingLabelFromScore(rating),
    reviewCount,
    starDistribution,
    writeReviewUrl: buildGoogleWriteReviewUrl(),
    mapsUrl: process.env.GOOGLE_MAPS_URL?.trim() || null,
    source: "fallback",
  };
}

type PlacesReview = {
  rating?: number;
  text?: { text?: string };
  publishTime?: string;
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
};

type PlacesDetailsResponse = {
  rating?: number;
  userRatingCount?: number;
  reviews?: PlacesReview[];
  googleMapsUri?: string;
  googleMapsLinks?: {
    writeAReviewUri?: string;
    placeUri?: string;
    reviewsUri?: string;
  };
};

async function fetchGooglePlaceDetails(): Promise<GoogleReviewsPayload | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (!apiKey || !placeId) {
    return null;
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`;
  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    console.error("[google-reviews] Places API error", response.status, await response.text());
    return null;
  }

  const data = (await response.json()) as PlacesDetailsResponse;
  const reviews: GoogleReviewItem[] = (data.reviews ?? [])
    .filter((review) => Boolean(review.text?.text?.trim()))
    .map((review) => ({
      profileImage:
        review.authorAttribution?.photoUri?.trim() ||
        "/assets/images/testimonial-1.png",
      name: review.authorAttribution?.displayName?.trim() || "Cliente Google",
      date: review.publishTime
        ? new Date(review.publishTime).toISOString()
        : new Date().toISOString(),
      grades: Math.max(1, Math.min(5, Math.round(Number(review.rating) || 5))),
      desc: review.text?.text?.trim() || "",
    }));

  const writeFromApi = data.googleMapsLinks?.writeAReviewUri?.trim();
  const writeReviewUrl = writeFromApi || buildGoogleWriteReviewUrl(placeId);
  const mapsUrl =
    data.googleMapsLinks?.placeUri?.trim() ||
    data.googleMapsUri?.trim() ||
    process.env.GOOGLE_MAPS_URL?.trim() ||
    null;

  const rating = typeof data.rating === "number" ? data.rating : null;
  const reviewCount =
    typeof data.userRatingCount === "number" ? data.userRatingCount : reviews.length;

  return {
    reviews: reviews.length ? reviews : FALLBACK_REVIEWS,
    rating,
    ratingLabel: ratingLabelFromScore(rating),
    reviewCount,
    starDistribution: null,
    writeReviewUrl,
    mapsUrl,
    source: reviews.length ? "google" : "fallback",
  };
}

const getCachedGoogleReviews = unstable_cache(
  async () => {
    try {
      const live = await fetchGooglePlaceDetails();
      return live ?? fallbackPayload();
    } catch (error) {
      console.error("[google-reviews] fetch failed", error);
      return fallbackPayload();
    }
  },
  ["google-place-reviews-v1"],
  { revalidate: 3600 },
);

export async function getGoogleReviews(): Promise<GoogleReviewsPayload> {
  return getCachedGoogleReviews();
}
