
export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type WalkingStep = {
  instruction: string;
  distance: number;
  duration: number;
  type: number;
  wayPoints: [number, number];
};

export type WalkingRoute = {
  coordinates: Coordinates[];
  distance: number;
  duration: number;
  steps: WalkingStep[];
};

// Replace this placeholder with your own OpenRouteService key.
// Do not commit a real key to a public GitHub repository.
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijc4ZTgzMGMxYTM0NTQxMjRhYjE5NTAwMmIwZDk1ZWY1IiwiaCI6Im11cm11cjY0In0=';

const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

export async function getWalkingRoute(
  start: Coordinates,
  destination: Coordinates
): Promise<WalkingRoute> {
  if (!ORS_API_KEY) {
    throw new Error(
      'Please configure your OpenRouteService API key first.'
    );
  }

  const response = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      Authorization: ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [start.longitude, start.latitude],
        [destination.longitude, destination.latitude],
      ],
      instructions: true,
      instructions_format: 'text',
      language: 'en',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Walking route request failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  const feature = data.features?.[0];

  if (!feature) {
    throw new Error('No walking route was found.');
  }

  const rawCoordinates =
    feature.geometry?.coordinates;

  const summary =
    feature.properties?.summary;

  const segments =
    feature.properties?.segments ?? [];

  if (!rawCoordinates || !summary) {
    throw new Error('The routing service returned invalid route data.');
  }

  const coordinates: Coordinates[] =
    rawCoordinates.map(
      ([longitude, latitude]: [number, number]) => ({
        latitude,
        longitude,
      })
    );

  const steps: WalkingStep[] =
    segments.flatMap((segment: any) =>
      (segment.steps ?? []).map((step: any) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration,
        type: step.type,
        wayPoints: [
          step.way_points?.[0] ?? 0,
          step.way_points?.[1] ?? 0,
        ] as [number, number],
      }))
    );

  return {
    coordinates,
    distance: summary.distance,
    duration: summary.duration,
    steps,
  };
}
