/**
 * Seed catalogue, modelled on the live service tracks at padosipro.com.
 * `icon` is a Feather icon name rendered by the mobile app.
 */
export interface SeedCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: { id: string; name: string; description: string }[];
}

export const catalogue: SeedCategory[] = [
  {
    id: 'home-services',
    name: 'Home Services',
    description: 'Repairs, cleaning and upkeep for your home.',
    icon: 'home',
    tasks: [
      { id: 'ac-repair', name: 'AC Repair & Service', description: 'Servicing, gas refills and repairs for split and window ACs.' },
      { id: 'deep-cleaning', name: 'Deep Cleaning', description: 'Full-home deep clean including kitchen and bathrooms.' },
      { id: 'pest-control', name: 'Pest Control', description: 'Cockroach, termite and mosquito treatment by vetted providers.' },
      { id: 'plumbing', name: 'Plumbing & Water Fixes', description: 'Leaks, taps, tanks and water purifier servicing.' },
      { id: 'handyman', name: 'Handyman Jobs', description: 'Fixing furniture, mounting TVs, hanging shelves and small repairs.' },
      { id: 'sofa-cleaning', name: 'Sofa & Carpet Cleaning', description: 'Shampooing and stain removal for sofas, carpets and mattresses.' },
    ],
  },
  {
    id: 'errands',
    name: 'Errands & Daily Tasks',
    description: 'The small jobs that eat up your day.',
    icon: 'shopping-bag',
    tasks: [
      { id: 'bank-work', name: 'Bank Work', description: 'Branch visits, cheque deposits, KYC updates and document submission.' },
      { id: 'laundry', name: 'Laundry Pickup & Drop', description: 'Washing, ironing and dry cleaning collected from your door.' },
      { id: 'grocery-run', name: 'Grocery & Essentials Run', description: 'Weekly groceries and household essentials, picked and delivered.' },
      { id: 'bill-payments', name: 'Bill Payments', description: 'Electricity, water, gas, property tax and society dues on time.' },
      { id: 'courier', name: 'Courier & Parcel Pickup', description: 'Sending and collecting parcels, returns and documents.' },
    ],
  },
  {
    id: 'health-medical',
    name: 'Health & Medical',
    description: 'Appointments, medicines and care at home.',
    icon: 'heart',
    tasks: [
      { id: 'doctor-appointments', name: 'Doctor Appointments', description: 'Booking consultations and managing follow-ups.' },
      { id: 'medicine-refills', name: 'Medicine Refills', description: 'Regular prescriptions refilled and delivered before they run out.' },
      { id: 'physiotherapy', name: 'Physiotherapy at Home', description: 'Certified physiotherapists for recovery and mobility.' },
      { id: 'lab-tests', name: 'Lab Tests at Home', description: 'Sample collection at home with reports shared digitally.' },
    ],
  },
  {
    id: 'senior-care',
    name: 'Senior Care',
    description: 'Looking after parents, even when you are far away.',
    icon: 'users',
    tasks: [
      { id: 'elderly-companion', name: 'Elderly Companion Care', description: 'Trained caregivers for company, meals and daily routines.' },
      { id: 'daily-check-ins', name: 'Daily Check-ins', description: 'A friendly call or visit every day, with updates sent to you.' },
      { id: 'hospital-escort', name: 'Hospital Visit Escort', description: 'Someone to accompany your parents to appointments and tests.' },
    ],
  },
  {
    id: 'travel-tourism',
    name: 'Travel & Tourism',
    description: 'Getting there, sorted end to end.',
    icon: 'map',
    tasks: [
      { id: 'airport-transfer', name: 'Airport Drop & Pickup', description: 'Reliable cabs timed to your flight, day or night.' },
      { id: 'car-rental', name: 'Car Rental with Driver', description: 'Cars with verified drivers for local or outstation trips.' },
      { id: 'passport-help', name: 'Passport Assistance', description: 'Applications, renewals and appointment slots handled for you.' },
      { id: 'travel-booking', name: 'Hotel & Ticket Booking', description: 'Trains, flights and stays booked to your preferences.' },
    ],
  },
  {
    id: 'events-management',
    name: 'Events & Management',
    description: 'Celebrations without the running around.',
    icon: 'gift',
    tasks: [
      { id: 'party-host', name: 'Party Hosting', description: 'Planning and running birthdays, anniversaries and get-togethers.' },
      { id: 'catering', name: 'Catering', description: 'Menus and caterers for small gatherings to large functions.' },
      { id: 'mehendi-artist', name: 'Mehendi Artist', description: 'Experienced mehendi artists for weddings and festivals.' },
      { id: 'decor-setup', name: 'Decor & Reception Setup', description: 'Flowers, lighting and stage setup for your event.' },
    ],
  },
  {
    id: 'digital-tech',
    name: 'Digital & Tech Help',
    description: 'Devices and online chores, handled patiently.',
    icon: 'monitor',
    tasks: [
      { id: 'device-repair', name: 'Laptop & Phone Repair', description: 'Diagnosis, repairs and data backup by trusted technicians.' },
      { id: 'wifi-setup', name: 'Wi-Fi & Device Setup', description: 'Routers, smart TVs, printers and CCTV set up and working.' },
      { id: 'online-forms', name: 'Online Forms & Applications', description: 'Government portals, bookings and applications filled correctly.' },
    ],
  },
  {
    id: 'relocation',
    name: 'Relocation Services',
    description: 'Moving home, minus the stress.',
    icon: 'truck',
    tasks: [
      { id: 'packers-movers', name: 'Packers & Movers', description: 'Packing, transport and unpacking with insured movers.' },
      { id: 'vehicle-rc', name: 'Vehicle RC Transfer', description: 'RC transfer, address change and NOC paperwork at the RTO.' },
      { id: 'address-change', name: 'Utility & Address Change', description: 'Gas, electricity, internet and bank address updates after a move.' },
    ],
  },
];
