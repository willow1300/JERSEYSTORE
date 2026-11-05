export interface League {
  id: string;
  name: string;
  country: string;
  price: string;
  image: string;
  clubs: string[];
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const clubImage = (name: string) => `/images/clubs/${slug(name)}.jpg`;

const make = (id: string, name: string, country: string, clubs: string[]): League => ({
  id,
  name,
  country,
  price: "$12.00",
  image: `/images/leagues/${id}.jpg`,
  clubs,
});

export const leagues: League[] = [
  make("premier-league", "Premier League", "England", [
    "Liverpool", "Arsenal", "Manchester City", "Chelsea",
    "Newcastle", "Aston Villa", "Nottingham Forest", "Brighton",
    "Bournemouth", "Brentford", "Fulham", "Crystal Palace",
    "Everton", "West Ham", "Manchester United", "Wolves",
    "Tottenham", "Leicester", "Ipswich", "Southampton",
  ]),
  make("laliga", "LaLiga", "Spain", [
    "Barcelona", "Real Madrid", "Atletico Madrid", "Athletic Club",
    "Villarreal", "Real Betis", "Celta Vigo", "Rayo Vallecano",
    "Osasuna", "Mallorca", "Real Sociedad", "Valencia",
    "Getafe", "Espanyol", "Alaves", "Girona",
    "Sevilla", "Leganes", "Las Palmas", "Valladolid",
  ]),
  make("serie-a", "Serie A", "Italy", [
    "Napoli", "Inter", "Atalanta", "Juventus",
    "AS Roma", "Fiorentina", "Lazio", "AC Milan",
    "Bologna", "Como", "Torino", "Udinese",
    "Genoa", "Verona", "Cagliari", "Parma",
    "Lecce", "Empoli", "Venezia", "Monza",
  ]),
  make("bundesliga", "Bundesliga", "Germany", [
    "Bayern München", "Bayer Leverkusen", "Eintracht Frankfurt", "Borussia Dortmund",
    "SC Freiburg", "FSV Mainz 05", "RB Leipzig", "Werder Bremen",
    "VfB Stuttgart", "Borussia Mönchengladbach", "VfL Wolfsburg", "FC Augsburg",
    "Union Berlin", "FC St. Pauli", "1899 Hoffenheim", "1. FC Heidenheim",
    "Holstein Kiel", "VfL Bochum",
  ]),
  make("ligue-1", "Ligue 1", "France", [
    "Paris Saint Germain", "Marseille", "Monaco", "Nice",
    "Lille", "Lyon", "Strasbourg", "Lens",
    "Stade Brestois 29", "Toulouse", "Auxerre", "Rennes",
    "Nantes", "Angers", "Le Havre", "Reims",
    "Saint Etienne", "Montpellier",
  ]),
  make("mls", "Major League Soccer", "USA", [
    "Inter Miami", "Columbus Crew", "FC Cincinnati", "Orlando City SC",
    "Charlotte", "New York City FC",
  ]),
  make("saudi-pro-league", "Saudi Pro League", "Saudi Arabia", [
    "Al-Ittihad FC", "Al-Hilal Saudi FC", "Al-Nassr", "Al-Qadisiyah FC",
    "Al-Ahli Jeddah", "Al Shabab",
  ]),
  make("country-kits", "Country Kits", "Global", [
    "Brazil", "Argentina", "England", "France", "Germany",
    "Portugal", "Spain", "Netherlands", "Japan", "Mexico",
    "Italy", "Belgium", "Croatia", "Uruguay", "Colombia",
    "Nigeria", "Senegal", "Morocco", "Egypt", "Australia",
    "Denmark", "Switzerland", "Poland",
  ]),
];
