// SULOFT — Static UI constants
// -----------------------------------------------------------------------------
// All dynamic data (items, claims, notifications, profiles, announcements)
// now comes from Supabase via `src/lib/api.ts`. This file holds only static
// dropdown options and dropdown label data used by forms and filters.
// -----------------------------------------------------------------------------

// Campus locations used in the location filter dropdown on Browse + Report forms.
// These are suggestions, not a closed list — the items table stores free-text.
export const campusLocations: string[] = [
  "Central Library",
  "Main Cafeteria",
  "CS Department",
  "Science Block",
  "Admin Block",
  "Main Gate",
  "Sports Complex",
  "Auditorium",
  "Examination Hall",
  "Parking Lot",
  "Hostel",
];

// Departments shown in the signup dropdown.
export const departments: string[] = [
  "Computer Science",
  "Software Engineering",
  "Business Administration",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "English Literature",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Library Services",
  "Administration",
];
