/* New Arrival section data for the landing page */
export interface Arrival {
  id: string;
  name: string;
  image: string;
  price: number;
}

export const NEW_ARRIVALS: Arrival[] = [
  { id: 'man-united',   name: 'Manchester United',            image: '/images/jerseys/ManchesterUnited_New.jpg',              price: 2000 },
  { id: 'man-city',     name: 'Manchester City',              image: '/images/jerseys/ManchesterCity_New.jpg',                price: 1500 },
  { id: 'chelsea',      name: 'Chelsea',                     image: '/images/jerseys/CHELSEA_New.webp',                       price: 2000 },
  { id: 'real-madrid',  name: 'Real Madrid',                  image: '/images/jerseys/Real%20madrid_New.jpg',                 price: 2500 },
  { id: 'liverpool',    name: 'Liverpool',                    image: '/images/jerseys/liverpool_New.jpg',                     price: 2000 },
  { id: 'liverpool-00', name: 'Liverpool 00/01 Away',         image: '/images/jerseys/LiverpoolFC2000-2001Away_New.webp',   price: 2500 },
  { id: 'juventus',     name: 'Juventus',                     image: '/images/jerseys/JUVENTUS_New.webp',                     price: 1500 },
  { id: 'psg',          name: 'PSG',                          image: '/images/jerseys/PSG_New.webp',                          price: 2000 },
  { id: 'santos',       name: 'Santos FC 2012',               image: '/images/jerseys/Santos%20FC%202012_New.webp',           price: 2500 },
];

/* Campaign preview-stack images (served from /images/legacy/) */
export const gangImages = ['gang1.jpg', 'gang2.jpg', 'gang4.jpg', 'gang5.jpg', 'gang6.jpg', 'gang7.jpg', 'gang8.jpg'] as const
