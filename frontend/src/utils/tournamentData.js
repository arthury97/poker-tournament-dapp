// Tournament data - Updated list of major poker tournaments
// This can be enhanced with API integration or web scraping in the future

export const tournamentList = [
  // World Series of Poker (WSOP)
  {
    id: 'wsop-main-2025',
    name: 'WSOP Main Event 2025',
    series: 'World Series of Poker',
    location: 'Las Vegas, USA',
    startDate: '2025-07-03',
    endDate: '2025-07-16',
    buyIn: 10000,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'wsop-global-2025',
    name: 'WSOP Global Championship 2025',
    series: 'World Series of Poker',
    location: 'Las Vegas, USA',
    startDate: '2025-05-28',
    endDate: '2025-07-16',
    buyIn: 5000,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'wsop-online-2025',
    name: 'WSOP Online Bracelet Series',
    series: 'World Series of Poker',
    location: 'Online',
    startDate: '2025-06-01',
    endDate: '2025-07-31',
    buyIn: 400,
    prizePool: 'TBD',
    type: 'online',
    status: 'upcoming'
  },

  // Asia Poker Tour (APT)
  {
    id: 'apt-taiwan-2025',
    name: 'APT Taiwan Main Event',
    series: 'Asia Poker Tour',
    location: 'Taipei, Taiwan',
    startDate: '2025-12-15',
    endDate: '2025-12-22',
    buyIn: 2500,
    prizePool: '50000',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'apt-manila-2025',
    name: 'APT Manila Main Event',
    series: 'Asia Poker Tour',
    location: 'Manila, Philippines',
    startDate: '2025-11-01',
    endDate: '2025-11-10',
    buyIn: 2200,
    prizePool: '40000',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'apt-online-2025',
    name: 'APT Online Series',
    series: 'Asia Poker Tour',
    location: 'Online',
    startDate: '2025-10-01',
    endDate: '2025-10-31',
    buyIn: 215,
    prizePool: 'TBD',
    type: 'online',
    status: 'upcoming'
  },

  // European Poker Tour (EPT)
  {
    id: 'ept-barcelona-2025',
    name: 'EPT Barcelona Main Event',
    series: 'European Poker Tour',
    location: 'Barcelona, Spain',
    startDate: '2025-08-20',
    endDate: '2025-08-31',
    buyIn: 5300,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'ept-prague-2025',
    name: 'EPT Prague Main Event',
    series: 'European Poker Tour',
    location: 'Prague, Czech Republic',
    startDate: '2025-12-06',
    endDate: '2025-12-17',
    buyIn: 5300,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'ept-online-2025',
    name: 'EPT Online Series',
    series: 'European Poker Tour',
    location: 'Online',
    startDate: '2025-09-01',
    endDate: '2025-09-30',
    buyIn: 530,
    prizePool: 'TBD',
    type: 'online',
    status: 'upcoming'
  },

  // World Poker Tour (WPT)
  {
    id: 'wpt-world-championship-2025',
    name: 'WPT World Championship',
    series: 'World Poker Tour',
    location: 'Las Vegas, USA',
    startDate: '2025-12-12',
    endDate: '2025-12-20',
    buyIn: 10400,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'wpt-paris-2025',
    name: 'WPT Paris Main Event',
    series: 'World Poker Tour',
    location: 'Paris, France',
    startDate: '2025-11-15',
    endDate: '2025-11-24',
    buyIn: 3500,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'wpt-online-2025',
    name: 'WPT Online Series',
    series: 'World Poker Tour',
    location: 'Online',
    startDate: '2025-10-15',
    endDate: '2025-11-15',
    buyIn: 320,
    prizePool: 'TBD',
    type: 'online',
    status: 'upcoming'
  },

  // Triton Poker Series
  {
    id: 'triton-london-2025',
    name: 'Triton Poker London',
    series: 'Triton Poker',
    location: 'London, UK',
    startDate: '2025-08-01',
    endDate: '2025-08-15',
    buyIn: 25000,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'triton-monaco-2025',
    name: 'Triton Poker Monaco',
    series: 'Triton Poker',
    location: 'Monaco',
    startDate: '2025-05-20',
    endDate: '2025-06-05',
    buyIn: 25000,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },

  // Partypoker Live
  {
    id: 'partypoker-millions-2025',
    name: 'partypoker LIVE Millions',
    series: 'partypoker LIVE',
    location: 'Various',
    startDate: '2025-07-01',
    endDate: '2025-07-31',
    buyIn: 5300,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'partypoker-online-2025',
    name: 'partypoker Online Series',
    series: 'partypoker',
    location: 'Online',
    startDate: '2025-09-15',
    endDate: '2025-10-15',
    buyIn: 109,
    prizePool: 'TBD',
    type: 'online',
    status: 'upcoming'
  },

  // PokerStars Championship
  {
    id: 'pokerstars-caribbean-2025',
    name: 'PokerStars Caribbean Adventure',
    series: 'PokerStars',
    location: 'Bahamas',
    startDate: '2025-01-21',
    endDate: '2025-01-30',
    buyIn: 5300,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },
  {
    id: 'pokerstars-online-2025',
    name: 'PokerStars Online Championship',
    series: 'PokerStars',
    location: 'Online',
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    buyIn: 215,
    prizePool: 'TBD',
    type: 'online',
    status: 'upcoming'
  },

  // US Poker Open
  {
    id: 'uspo-2025',
    name: 'US Poker Open 2025',
    series: 'US Poker Open',
    location: 'Las Vegas, USA',
    startDate: '2025-02-10',
    endDate: '2025-02-22',
    buyIn: 10000,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  },

  // Super High Roller Bowl
  {
    id: 'shrb-2025',
    name: 'Super High Roller Bowl 2025',
    series: 'Super High Roller Bowl',
    location: 'Las Vegas, USA',
    startDate: '2025-05-30',
    endDate: '2025-06-02',
    buyIn: 300000,
    prizePool: 'TBD',
    type: 'in-person',
    status: 'upcoming'
  }
];

// Helper function to get tournaments by type
export const getTournamentsByType = (type) => {
  return tournamentList.filter(t => t.type === type);
};

// Helper function to search tournaments
export const searchTournaments = (query) => {
  const lowerQuery = query.toLowerCase();
  return tournamentList.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.series.toLowerCase().includes(lowerQuery) ||
    t.location.toLowerCase().includes(lowerQuery)
  );
};

// Helper function to get tournament by ID
export const getTournamentById = (id) => {
  return tournamentList.find(t => t.id === id);
};

