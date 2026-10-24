export interface Team {
  id: string;
  name: string;
  league: string;
  crest: string;
  jersey: string;
  awayJersey?: string;
  heroJersey?: string;
  price: string;
}

export const teamSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const teamCrest = (id: string) => `/images/clubs/${id}.png`;

const team = (
  id: string,
  name: string,
  league: string,
  jersey: string,
  price: string = "$12.00",
  awayJersey?: string,
  heroJersey?: string,
): Team => ({
  id,
  name,
  league,
  crest: teamCrest(id),
  jersey,
  awayJersey,
  heroJersey,
  price,
});

export const teams: Team[] = [
  team("tottenham-hotspur", "Tottenham Hotspur", "Premier League", "/images/jerseys/tottenham.jpg"),
  team("manchester-city", "Manchester City", "Premier League", "/images/jerseys/manchester-city.jpg"),
  team("newcastle-united", "Newcastle United", "Premier League", "/images/jerseys/newcastle.jpg"),
  team("liverpool", "Liverpool", "Premier League", "/images/jerseys/liverpool.jpg"),
  team("chelsea", "Chelsea", "Premier League", "/images/jerseys/chelsea.jpg"),
  team("everton", "Everton", "Premier League", "/images/jerseys/everton.jpg"),
  team("arsenal", "Arsenal", "Premier League", "/images/jerseys/arsenal.jpg"),
  team("crystal-palace", "Crystal Palace", "Premier League", "/images/jerseys/crystal-palace.jpg"),
  team("manchester-united", "Manchester United", "Premier League", "/images/jerseys/manchester-united.jpg"),
  team("hull-city", "Hull City", "Premier League", "/images/jerseys/hull-city.jpg"),
  team("aston-villa", "Aston Villa", "Premier League", "/images/jerseys/aston-villa.jpg"),
  team("nottingham-forest", "Nottingham Forest", "Premier League", "/images/jerseys/nottingham-forest.jpg"),
  team("real-madrid", "Real Madrid", "LaLiga", "/images/jerseys/real-madrid.jpg"),
  team("barcelona", "Barcelona", "LaLiga", "/images/jerseys/barcelona.jpg"),
  team("atletico-madrid", "Atletico Madrid", "LaLiga", "/images/jerseys/atletico-madrid.jpg"),
  team("sevilla", "Sevilla", "LaLiga", "/images/jerseys/sevilla.jpg"),
  team("real-betis", "Real Betis", "LaLiga", "/images/jerseys/real-betis.jpg"),
  team("real-sociedad", "Real Sociedad", "LaLiga", "/images/jerseys/real-sociedad.jpg"),
  team("athletic-club", "Athletic Club", "LaLiga", "/images/jerseys/athletic-club.jpg"),
  team("villarreal", "Villarreal", "LaLiga", "/images/jerseys/villarreal.jpg"),
  team("inter-milan", "Inter Milan", "Serie A", "/images/jerseys/inter-milan.jpg"),
  team("ac-milan", "AC Milan", "Serie A", "/images/jerseys/ac-milan.jpg"),
  team("juventus", "Juventus", "Serie A", "/images/jerseys/juventus.jpg"),
  team("napoli", "Napoli", "Serie A", "/images/jerseys/napoli.jpg"),
  team("roma", "Roma", "Serie A", "/images/jerseys/roma.jpg"),
  team("lazio", "Lazio", "Serie A", "/images/jerseys/lazio.jpg"),
  team("atalanta", "Atalanta", "Serie A", "/images/jerseys/atalanta.jpg"),
  team("fiorentina", "Fiorentina", "Serie A", "/images/jerseys/fiorentina.jpg"),
  team("bayern-munich", "Bayern Munich", "Bundesliga", "/images/jerseys/bayern-munich.jpg"),
  team("borussia-dortmund", "Borussia Dortmund", "Bundesliga", "/images/jerseys/borussia-dortmund.jpg"),
  team("bayer-leverkusen", "Bayer Leverkusen", "Bundesliga", "/images/jerseys/bayer-leverkusen.jpg"),
  team("rb-leipzig", "RB Leipzig", "Bundesliga", "/images/jerseys/rb-leipzig.jpg"),
  team("eintracht-frankfurt", "Eintracht Frankfurt", "Bundesliga", "/images/jerseys/eintracht-frankfurt.jpg"),
  team("vfb-stuttgart", "VfB Stuttgart", "Bundesliga", "/images/jerseys/vfb-stuttgart.jpg"),
  team("paris-saint-germain", "Paris Saint-Germain", "Ligue 1", "/images/jerseys/psg.jpg"),
  team("marseille", "Marseille", "Ligue 1", "/images/jerseys/marseille.jpg"),
  team("lyon", "Lyon", "Ligue 1", "/images/jerseys/lyon.jpg"),
  team("monaco", "Monaco", "Ligue 1", "/images/jerseys/monaco.jpg"),
  team("lille", "Lille", "Ligue 1", "/images/jerseys/lille.jpg"),
  team("nice", "Nice", "Ligue 1", "/images/jerseys/nice.jpg"),
  team("inter-miami", "Inter Miami", "Major League Soccer", "/images/jerseys/inter-miami.jpg"),
  team("la-galaxy", "LA Galaxy", "Major League Soccer", "/images/jerseys/la-galaxy.jpg"),
  team("lafc", "LAFC", "Major League Soccer", "/images/jerseys/lafc.jpg"),
  team("seattle-sounders", "Seattle Sounders", "Major League Soccer", "/images/jerseys/seattle-sounders.jpg"),
  team("new-york-city-fc", "New York City FC", "Major League Soccer", "/images/jerseys/nyc-fc.jpg"),
  team("atlanta-united", "Atlanta United", "Major League Soccer", "/images/jerseys/atlanta-united.jpg"),
  team("al-nassr", "Al Nassr", "Saudi Pro League", "/images/jerseys/al-nassr.jpg"),
  team("al-hilal", "Al Hilal", "Saudi Pro League", "/images/jerseys/al-hilal.jpg"),
  team("al-ittihad", "Al Ittihad", "Saudi Pro League", "/images/jerseys/al-ittihad.jpg"),
  team("al-ahli", "Al Ahli", "Saudi Pro League", "/images/jerseys/al-ahli.jpg"),
  team("al-shabab", "Al Shabab", "Saudi Pro League", "/images/jerseys/al-shabab.jpg"),
  team("brazil", "Brazil", "Country Kits", "/images/jerseys/brazil.jpg"),
  team("argentina", "Argentina", "Country Kits", "/images/jerseys/argentina.jpg"),
  team("england", "England", "Country Kits", "/images/jerseys/england.jpg"),
  team("france", "France", "Country Kits", "/images/jerseys/france.jpg"),
  team("germany", "Germany", "Country Kits", "/images/jerseys/germany.jpg"),
  team("portugal", "Portugal", "Country Kits", "/images/jerseys/portugal.jpg"),
  team("spain", "Spain", "Country Kits", "/images/jerseys/spain.jpg"),
  team("netherlands", "Netherlands", "Country Kits", "/images/jerseys/netherlands.jpg"),
  team("japan", "Japan", "Country Kits", "/images/jerseys/japan.jpg"),
  team("mexico", "Mexico", "Country Kits", "/images/jerseys/mexico.jpg"),
  team("italy", "Italy", "Country Kits", "/images/jerseys/italy.jpg"),
  team("belgium", "Belgium", "Country Kits", "/images/jerseys/belgium.jpg"),
  team("croatia", "Croatia", "Country Kits", "/images/jerseys/croatia.jpg"),
  team("uruguay", "Uruguay", "Country Kits", "/images/jerseys/uruguay.jpg"),
  team("colombia", "Colombia", "Country Kits", "/images/jerseys/colombia.jpg"),
  team("nigeria", "Nigeria", "Country Kits", "/images/jerseys/nigeria.jpg"),
  team("senegal", "Senegal", "Country Kits", "/images/jerseys/senegal.jpg"),
  team("morocco", "Morocco", "Country Kits", "/images/jerseys/morocco.jpg"),
  team("egypt", "Egypt", "Country Kits", "/images/jerseys/egypt.jpg"),
  team("australia", "Australia", "Country Kits", "/images/jerseys/australia.jpg"),
  team("denmark", "Denmark", "Country Kits", "/images/jerseys/denmark.jpg"),
  team("switzerland", "Switzerland", "Country Kits", "/images/jerseys/switzerland.jpg"),
  team("poland", "Poland", "Country Kits", "/images/jerseys/poland.jpg"),
];

export const findTeam = (id: string) =>
  teams.find((t) => t.id === id || teamSlug(t.name) === id || teamSlug(t.id) === id);
export const teamsByLeague = (leagueId: string) =>
  teams.filter((t) => {
    const map: Record<string, string[]> = {
      "premier-league": ["tottenham-hotspur", "manchester-city", "newcastle-united", "liverpool", "chelsea", "everton", "arsenal", "crystal-palace", "manchester-united", "hull-city", "aston-villa", "nottingham-forest"],
      "laliga": ["real-madrid", "barcelona", "atletico-madrid", "sevilla", "real-betis", "real-sociedad", "athletic-club", "villarreal"],
      "serie-a": ["inter-milan", "ac-milan", "juventus", "napoli", "roma", "lazio", "atalanta", "fiorentina"],
      "bundesliga": ["bayern-munich", "borussia-dortmund", "bayer-leverkusen", "rb-leipzig", "eintracht-frankfurt", "vfb-stuttgart"],
      "ligue-1": ["paris-saint-germain", "marseille", "lyon", "monaco", "lille", "nice"],
      "mls": ["inter-miami", "la-galaxy", "lafc", "seattle-sounders", "new-york-city-fc", "atlanta-united"],
      "saudi-pro-league": ["al-nassr", "al-hilal", "al-ittihad", "al-ahli", "al-shabab"],
      "country-kits": ["brazil", "argentina", "england", "france", "germany", "portugal", "spain", "netherlands", "japan", "mexico", "italy", "belgium", "croatia", "uruguay", "colombia", "nigeria", "senegal", "morocco", "egypt", "australia", "denmark", "switzerland", "poland"],
    };
    return map[leagueId]?.includes(t.id) ?? false;
  });
