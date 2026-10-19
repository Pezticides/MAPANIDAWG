
export type CampusLocation = {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
};

export const CAMPUS_CENTER = {
  latitude: 8.4855,
  longitude: 124.6560,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

// Starter coordinates only. Verify all locations
// against the actual USTP CDO campus before publishing.
export const campusLocations: CampusLocation[] = [
  {
    id: 'main',
    name: 'USTP Campus Center',
    category: 'Facility',
    description: 'Campus reference point. Verify its exact location.',
    latitude: 8.4855,
    longitude: 124.6560,
  },
  {
    id: 'academic',
    name: 'Academic Building',
    category: 'Academic',
    description: 'Example academic building pin.',
    latitude: 8.4860,
    longitude: 124.6554,
  },
  {
    id: 'admin',
    name: 'Administration Office',
    category: 'Office',
    description: 'Example administration office pin.',
    latitude: 8.4850,
    longitude: 124.6565,
  },
  {
    id: 'food',
    name: 'Food Area',
    category: 'Food',
    description: 'Example campus food facility pin.',
    latitude: 8.4849,
    longitude: 124.6555,
  },
  {
    id: 'facility',
    name: 'Campus Facility',
    category: 'Facility',
    description: 'Example campus facility pin.',
    latitude: 8.4862,
    longitude: 124.6565,
  },
  {
    id: 'citc-building-9',
    name: 'CITC Building 9',
    category: 'Academic',
    description: 'College of Information Technology and Computing (CITC), USTP CDO.',
    latitude: 8.485942,
    longitude: 124.657316,
  },
];
