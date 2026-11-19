
import { ImageSourcePropType } from 'react-native';

export type CampusLocation = {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  image?: ImageSourcePropType;
  isApproximate: boolean;
};

export const CAMPUS_CENTER = {
  latitude: 8.4855,
  longitude: 124.6560,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006,
};

export const campusLocations: CampusLocation[] = [
  // ACADEMIC CORE & ADMINISTRATION

  {
    id: 'building-3',
    name: 'Bldg. 3 - College of Medicine',
    category: 'Academic',
    description: 'College of Medicine, USTP CDO. Approximate public map location.',
    latitude: 8.48609,
    longitude: 124.65826,
    image: require('../assets/images/BUILDING 3.jpg'),
    isApproximate: true,
  },
  {
    id: 'building-10',
    name: 'Bldg. 10 - Administration Building',
    category: 'Office',
    description: 'Administration Building, USTP CDO.',
    latitude: 8.485992094859405,
    longitude: 124.6572460611573,
    image: require('../assets/images/BUILDING 10.jpg'),
    isApproximate: false,
  },
  {
    id: 'building-14',
    name: 'Bldg. 14 - Finance and Accounting / Senior High School',
    category: 'Office',
    description: 'Finance and Accounting / Senior High School Building, across the ICT Building.',
    latitude: 8.486240147154303,
    longitude: 124.65682416439887,
    image: require('../assets/images/BUILDING 14.jpg'),
    isApproximate: false,
  },
  {
    id: 'building-41',
    name: 'Bldg. 41 - Science Complex',
    category: 'Academic',
    description: 'Science Complex, USTP CDO.',
    latitude: 8.48645,
    longitude: 124.65545,
    image: require('../assets/images/BUILDING 41.jpg'),
    isApproximate: true,
  },
  {
    id: 'building-47',
    name: 'Bldg. 47 - Technology Building',
    category: 'Academic',
    description: 'Technology Building, USTP CDO.',
    latitude: 8.486913583535681,
    longitude: 124.65519799332067,
    image: require('../assets/images/BUILDING47.jpg'),
    isApproximate: false,
  },

  // ENGINEERING & TECHNOLOGY HUBS

  {
    id: 'building-5',
    name: 'Bldg. 5 - Old Engineering Building',
    category: 'Academic',
    description: 'Old Engineering Building, USTP CDO.',
    latitude: 8.48576681052975,
    longitude: 124.65749687356862,
    isApproximate: false,
  },
  {
    id: 'building-9',
    name: 'Bldg. 9 - ICT Building',
    category: 'Academic',
    description: 'Information and Communication Technology Building, USTP CDO.',
    latitude: 8.486358187165562,
    longitude: 124.65727020103762,
    image: require('../assets/images/CICTBUILDING9.jpg'),
    isApproximate: false,
  },
  {
    id: 'building-42',
    name: 'Bldg. 42 - Engineering Complex I',
    category: 'Academic',
    description: 'Engineering Complex I, Right Wing, USTP CDO.',
    latitude: 8.48482228490759,
    longitude: 124.65676993835987,
    isApproximate: true,
  },
  {
    id: 'building-43',
    name: 'Bldg. 43 - Engineering Complex II',
    category: 'Academic',
    description: 'Engineering Complex II, Left Wing, USTP CDO.',
    latitude: 8.484949621789301,
    longitude: 124.6570891212296,
    image: require('../assets/images/BUILDING43.jpg'),
    isApproximate: true,
  },
  // STUDENT SERVICES & GENERAL FACILITIES

  {
    id: 'building-15',
    name: 'Bldg. 15 - Gymnasium Lobby',
    category: 'Facility',
    description: 'Gymnasium Lobby, USTP CDO.',
    latitude: 8.486134644424983,
    longitude: 124.65644688845259,
    image: require('../assets/images/GYMNASIUN.png'),
    isApproximate: false,
  },
  {
    id: 'building-16',
    name: 'Bldg. 16 - Gymnasium / DRER Memorial Hall',
    category: 'Facility',
    description: 'Gymnasium and DRER Memorial Hall, USTP CDO.',
    latitude: 8.485842,
    longitude: 124.656440,
    image: require('../assets/images/BUILDING16.jpg'),
    isApproximate: true,
  },
  {
    id: 'building-20',
    name: 'Bldg. 20 - Cafeteria',
    category: 'Food',
    description: 'USTP CDO Cafeteria.',
    latitude: 8.485204,
    longitude: 124.6567697,
    image: require('../assets/images/BUILDING20.jpg'),
    isApproximate: true,
  },
  {
    id: 'building-21',
    name: 'Bldg. 21 - Guard House',
    category: 'Facility',
    description: 'Guard House, USTP CDO.',
    latitude: 8.48505,
    longitude: 124.65650,
    image: require('../assets/images/BUILDING21.png'),
    isApproximate: true,
  },
  {
    id: 'building-23',
    name: 'Bldg. 23 - Learning Resource Center',
    category: 'Academic',
    description: 'Learning Resource Center, USTP CDO.',
    latitude: 8.486630,
    longitude: 124.655804,
    image: require('../assets/images/LRCBUILDING24.jpg'),
    isApproximate: true,
  },
  {
    id: 'building-27',
    name: 'Bldg. 27 - University Health Center / OSA',
    category: 'Office',
    description: 'University Health Center and Office of Student Affairs, USTP CDO.',
    latitude: 8.486077,
    longitude: 124.655630,
    image: require('../assets/images/MEDICALBUILDING.jpg'),
    isApproximate: true,
  },
  {
    id: 'building-51',
    name: 'Bldg. 51 - Dormitory',
    category: 'Facility',
    description: 'Student Dormitory, USTP CDO.',
    latitude: 8.487129103574485,
    longitude: 124.65617156592654,
    image: require('../assets/images/BUILDING 51.jpg'),
    isApproximate: false,
  },

  // SPECIALIZED, LEGACY & OTHER SPACES

  {
    id: 'building-18',
    name: 'Bldg. 18 - Culinary Building',
    category: 'Academic',
    description: 'Culinary Building, USTP CDO.',
    latitude: 8.48536936414219,
    longitude: 124.65721387228605,
    image: require('../assets/images/BUILDING18.jpg'),
    isApproximate: false,
  },
  {
    id: 'building-19',
    name: 'Bldg. 19 - NSTP Building',
    category: 'Academic',
    description: 'National Service Training Program Building, USTP CDO.',
    latitude: 8.485077550709118,
    longitude: 124.65715821644972,
    image: require('../assets/images/BUILDING 19 NSTP.jpg'),
    isApproximate: false,
  },
  {
    id: 'building-24',
    name: "Bldg. 24 - Girl's Trade Building",
    category: 'Academic',
    description: "Girl's Trade Building, USTP CDO.",
    latitude: 8.48590,
    longitude: 124.65580,
    image: require('../assets/images/BUILDING24.jpg'),
    isApproximate: true,
  },
  {
    id: 'building-25',
    name: 'Bldg. 25 - Food Innovation Center',
    category: 'Academic',
    description: 'Food Innovation Center, USTP CDO.',
    latitude: 8.486312292473889,
    longitude: 124.65588785374032,
    image: require('../assets/images/BUILDING25.jpg'),
    isApproximate: false,
  },
  {
    id: 'building-26',
    name: 'Bldg. 26 - Food Innovation Center',
    category: 'Academic',
    description: 'Food Innovation Center, USTP CDO.',
    latitude: 8.486410788272485,
    longitude: 124.65613028807715,
    image: require('../assets/images/BUILDING26.jpg'),
    isApproximate: false,
  },
  {
    id: 'building-28',
    name: 'Bldg. 28 - Old Science Building',
    category: 'Academic',
    description: 'Old Science Building, USTP CDO.',
    latitude: 8.48598276912622,
    longitude: 124.65596274972758,
    image: require('../assets/images/BUILDING 28.png'),
    isApproximate: false,
  },
  {
    id: 'movable-classroom',
    name: 'Movable Classroom',
    category: 'Academic',
    description: 'Movable Classroom, USTP CDO.',
    latitude: 8.486640705329465,
    longitude: 124.65685941127226,
    image: require('../assets/images/MOVABLE CLASSROOM.jpg'),
    isApproximate: false,
  },
];
