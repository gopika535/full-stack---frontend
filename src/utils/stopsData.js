import { fmtTime } from './format'

// Database of 5+ stops for major cities + dynamic generator fallback for any city
const CITIES_STOPS = {
  chennai: [
    { name: 'Koyambedu (CMBT)', landmark: 'Main Inter-State Bus Terminus, Platform 4' },
    { name: 'Guindy Metro Station', landmark: 'Near Guindy Railway Station Exit' },
    { name: 'Tambaram', landmark: 'Opposite West Railway Station Arch' },
    { name: 'Ashok Pillar', landmark: 'Near Bus Depot Roundana' },
    { name: 'Porur Junction', landmark: 'Toll Gate Boarding Point' },
    { name: 'Perungalathur', landmark: 'NH Bypass Boarding Stop' },
  ],
  bangalore: [
    { name: 'Majestic (Kempegowda BS)', landmark: 'KSRTC Terminal 1, Gate 3' },
    { name: 'Electronic City', landmark: 'Toll Gate Boarding Point' },
    { name: 'Silk Board Junction', landmark: 'Near Flyover Boarding Stop' },
    { name: 'Madiwala', landmark: 'Near St. John’s Hospital Gate' },
    { name: 'Shantinagar Depot', landmark: 'Main KSRTC Bus Stand' },
    { name: 'Whitefield', landmark: 'ITPB Main Gate Boarding' },
  ],
  bengaluru: [
    { name: 'Majestic (Kempegowda BS)', landmark: 'KSRTC Terminal 1, Gate 3' },
    { name: 'Electronic City', landmark: 'Toll Gate Boarding Point' },
    { name: 'Silk Board Junction', landmark: 'Near Flyover Boarding Stop' },
    { name: 'Madiwala', landmark: 'Near St. John’s Hospital Gate' },
    { name: 'Shantinagar Depot', landmark: 'Main KSRTC Bus Stand' },
    { name: 'Whitefield', landmark: 'ITPB Main Gate Boarding' },
  ],
  coimbatore: [
    { name: 'Gandhipuram Central BS', landmark: 'Mettupalayam Road Gate' },
    { name: 'Hope College', landmark: 'Avinashi Road Bus Stop' },
    { name: 'KMCH Hospital Stop', landmark: 'NH Bypass Junction' },
    { name: 'Ukkadam Bus Stand', landmark: 'Main Terminal Entrance' },
    { name: 'Singanallur', landmark: 'Trichy Road Boarding Stop' },
    { name: 'Peelamedu', landmark: 'Airport Road Junction' },
  ],
  madurai: [
    { name: 'Mattuthavani (MIBT)', landmark: 'Integrated Bus Terminus, Bay 2' },
    { name: 'Periyar Bus Stand', landmark: 'Near Central Railway Station' },
    { name: 'Arappalayam', landmark: 'Dindigul Road Terminal' },
    { name: 'Fathima College', landmark: 'Bypass Junction Stop' },
    { name: 'Othakadai', landmark: 'Melur Road Boarding Point' },
  ],
  trichy: [
    { name: 'Central Bus Stand (CBS)', landmark: 'Platform 5, Main Gate' },
    { name: 'Chathiram Bus Stand', landmark: 'Near Fort Railway Station' },
    { name: 'TVS Toll Gate', landmark: 'Pudukkottai Road Junction' },
    { name: 'No. 1 Tollgate', landmark: 'Samayapuram NH Road' },
    { name: 'Palpannai Junction', landmark: 'Tanjore Road Bypass Stop' },
  ],
  tiruchirappalli: [
    { name: 'Central Bus Stand (CBS)', landmark: 'Platform 5, Main Gate' },
    { name: 'Chathiram Bus Stand', landmark: 'Near Fort Railway Station' },
    { name: 'TVS Toll Gate', landmark: 'Pudukkottai Road Junction' },
    { name: 'No. 1 Tollgate', landmark: 'Samayapuram NH Road' },
    { name: 'Palpannai Junction', landmark: 'Tanjore Road Bypass Stop' },
  ],
  salem: [
    { name: 'New Bus Stand', landmark: 'Central Terminal, Bay 1' },
    { name: 'Kondalampatti', landmark: 'NH Bypass Roundana' },
    { name: 'Five Roads (AVR Roundana)', landmark: 'Opposite AVR Theatre' },
    { name: 'Seelanaickenpatti', landmark: 'Bypass Junction Stop' },
    { name: 'Ammapet', landmark: 'Attur Main Road Stop' },
  ],
  erode: [
    { name: 'Central Bus Stand', landmark: 'Main Bay Entrance' },
    { name: 'Perundurai', landmark: 'Bypass Toll Junction' },
    { name: 'Lakshmi Nagar', landmark: 'Bypass Boarding Point' },
    { name: 'Chithode', landmark: 'NH47 Boarding Junction' },
    { name: 'Bull Ring Junction', landmark: 'Near Railway Station Road' },
  ],
  tirupur: [
    { name: 'New Bus Stand', landmark: 'Main Terminal' },
    { name: 'Old Bus Stand', landmark: 'Near Town Hall' },
    { name: 'Avinashi', landmark: 'NH Bypass Junction' },
    { name: 'Palladam Road', landmark: 'Kovilpalayam Boarding Stop' },
    { name: 'Pushpa Theatre', landmark: 'College Road Junction' },
  ],
  pondicherry: [
    { name: 'New Bus Stand', landmark: 'Maraimalai Adigal Salai' },
    { name: 'Rajiv Gandhi Statue', landmark: 'ECR Junction' },
    { name: 'JIPMER Hospital Gate', landmark: 'Main Gate Stop' },
    { name: 'Gorimedu', landmark: 'Tindivanam Road Check Post' },
    { name: 'ECR Toll Gate', landmark: 'Kottakuppam Check Post' },
  ],
  puducherry: [
    { name: 'New Bus Stand', landmark: 'Maraimalai Adigal Salai' },
    { name: 'Rajiv Gandhi Statue', landmark: 'ECR Junction' },
    { name: 'JIPMER Hospital Gate', landmark: 'Main Gate Stop' },
    { name: 'Gorimedu', landmark: 'Tindivanam Road Check Post' },
    { name: 'ECR Toll Gate', landmark: 'Kottakuppam Check Post' },
  ],
  hyderabad: [
    { name: 'MGBS (Mahatma Gandhi BS)', landmark: 'Platform 8, Gowliguda' },
    { name: 'Ameerpet Metro Station', landmark: 'Exit Gate 2' },
    { name: 'Lakdikapul', landmark: 'Near Bus Stop Arch' },
    { name: 'Kukatpally Housing Board', landmark: 'KPHB Metro Pillar 15' },
    { name: 'Miyapur', landmark: 'Allwyn X Road Boarding Stop' },
    { name: 'Gachibowli', landmark: 'Outer Ring Road Junction' },
  ],
  kochi: [
    { name: 'Vyttila Mobility Hub', landmark: 'Terminal Gate 1' },
    { name: 'Aluva Metro Station', landmark: 'Under Metro Bridge' },
    { name: 'Ernakulam KSRTC BS', landmark: 'Main Terminal' },
    { name: 'Edappally Toll', landmark: 'Lulu Mall Bypass Junction' },
    { name: 'Palarivattom', landmark: 'Bypass Stop' },
  ],
  trivandrum: [
    { name: 'Thampanoor Central BS', landmark: 'Opposite Railway Station' },
    { name: 'Kazhakkoottam', landmark: 'Technopark Phase 1 Main Gate' },
    { name: 'Ulloor Junction', landmark: 'MC Road Boarding Stop' },
    { name: 'Attingal Bypass', landmark: 'National Highway Junction' },
    { name: 'Eanchakkal', landmark: 'Bypass Terminal Gate' },
  ]
}

// Generate 5 stops for ANY city (either pre-configured or dynamic fallback)
export function getStopsForCity(cityName = '', type = 'pickup', baseDateTime) {
  const cleanCity = cityName.trim().toLowerCase()
  const list = CITIES_STOPS[cleanCity] || [
    { name: `${cityName} Central Bus Stand`, landmark: 'Main Inter-City Terminal' },
    { name: `${cityName} Bypass NH Junction`, landmark: 'Highway Boarding Plaza' },
    { name: `${cityName} Railway Station Arch`, landmark: 'Station Road Exit Stop' },
    { name: `${cityName} Main Toll Plaza`, landmark: 'Highway Junction Gate' },
    { name: `${cityName} Suburban Boarding Stop`, landmark: 'Town Circle Stop' },
  ]

  const baseDate = baseDateTime ? new Date(baseDateTime) : new Date()

  return list.map((item, idx) => {
    // Add offset minutes for each stop (e.g., 0m, 15m, 30m, 45m, 60m for pickup)
    // or (-30m, -15m, 0m, +15m, +30m for drop)
    let offsetMinutes = 0
    if (type === 'pickup') {
      offsetMinutes = idx * 15
    } else {
      offsetMinutes = (idx - 2) * 15
    }

    const stopDate = new Date(baseDate.getTime() + offsetMinutes * 60000)
    return {
      id: `${cleanCity}-${type}-${idx}`,
      name: item.name,
      landmark: item.landmark,
      time: fmtTime(stopDate.toISOString()),
      rawTime: stopDate,
    }
  })
}

