export const FIREBASE_TOKEN_NAME = "auth_token";

export const yesNo = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Unknown", label: "Unknown" },
];
export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const topCategoryStyles = {
  "Food and Drink": {
    bg: "bg-blue-25",
    circleBg: "bg-blue-100",
    text: {
      main: "text-blue-900",
      count: "text-blue-700",
    },
    progress: {
      bg: "bg-blue-100",
      indicator: "bg-blue-700",
    },
    icon: "/icons/monitor.svg",
  },
  Travel: {
    bg: "bg-success-25",
    circleBg: "bg-success-100",
    text: {
      main: "text-success-900",
      count: "text-success-700",
    },
    progress: {
      bg: "bg-success-100",
      indicator: "bg-success-700",
    },
    icon: "/icons/coins.svg",
  },
  default: {
    bg: "bg-pink-25",
    circleBg: "bg-pink-100",
    text: {
      main: "text-pink-900",
      count: "text-pink-700",
    },
    progress: {
      bg: "bg-pink-100",
      indicator: "bg-pink-700",
    },
    icon: "/icons/shopping-bag.svg",
  },
};

export const sidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/client/home",
    label: "Home",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/client/my-funding",
    label: "My Funding",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/client/income-funding",
    label: "Income Funding",
  },
  {
    imgURL: "/icons/file-chart-column.svg",
    route: "/client/my-analysis",
    label: "My Analysis",
  },
  {
    imgURL: "/icons/credit-card.svg",
    route: "/client/my-accounts",
    label: "My Accounts",
  },
  {
    imgURL: "/icons/building-2.svg",
    route: "/client/my-business",
    label: "My Business",
  },
  // {
  //   imgURL: "/icons/transaction.svg",
  //   route: "/transaction-history",
  //   label: "Transaction History",
  // },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/client/my-credit",
    label: "My Credit",
  },
  // {
  //   imgURL: "/icons/dollar-circle.svg",
  //   route: "/my-tradelines",
  //   label: "My Tradelines",
  // },
  {
    imgURL: "/icons/files.svg",
    route: "/client/my-documents",
    label: "My Documents",
  },
  {
    imgURL: "/icons/mail.svg",
    route: "/client/letter-stream",
    label: "Letter Stream",
  },
  {
    imgURL: "/icons/book-open-text.svg",
    route: "/client/my-learning",
    label: "My Learning",
  },
  {
    imgURL: "/icons/chart-no-axes-combined.svg",
    route: "/client/tradelines",
    label: "Tradelines",
  },
  // {
  //   imgURL: "/icons/dollar-circle.svg",
  //   route: "/whats-new",
  //   label: "What's New",
  // },
  {
    imgURL: "/icons/headset.svg",
    route: "/client/support-service",
    label: "Contact Us",
  },
];

export const adminSidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/admin/home",
    label: "Home",
  },
  {
    imgURL: "/icons/users.svg",
    route: "/admin/clients",
    label: "Clients",
  },
  {
    imgURL: "/icons/user-round-plus.svg",
    route: "/admin/leads",
    label: "Leads",
  },
  {
    imgURL: "/icons/handshake.svg",
    route: "/admin/brokers",
    label: "Brokers",
  },
  // {
  //   imgURL: "/icons/building-2.svg",
  //   route: "/admin/brokerages",
  //   label: "Brokerages",
  // },
  // {
  //   imgURL: "/icons/credit-card.svg",
  //   route: "/admin/funding-products",
  //   label: "Products",
  // },
  // {
  //   imgURL: "/icons/landmark.svg",
  //   route: "/admin/bank-products",
  //   label: "Bank Products",
  // },
  {
    imgURL: "/icons/landmark.svg",
    route: "/admin/bank-products-new",
    label: "Bank Products",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/admin/funding-application",
    label: "Funding Applications",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/admin/coordinator",
    label: "Loan Coordinator",
  },
  {
    imgURL: "/icons/chart-no-axes-combined.svg",
    route: "/admin/tradelines",
    label: "Tradelines",
  },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/admin/payments",
    label: "Payments",
  },
  {
    imgURL: "/icons/phone-call.svg",
    route: "/admin/call-requests",
    label: "Call Requests",
  },
  {
    imgURL: "/icons/bell.svg",
    route: "/admin/whats-new",
    label: "What's New",
  },
  {
    imgURL: "/icons/book-open-text.svg",
    route: "/admin/educational-materials",
    label: "Educational Materials",
  },
  {
    imgURL: "/icons/mail.svg",
    route: "/admin/mail",
    label: "Mail",
  },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/admin/fee-settings",
    label: "Fee Settings",
  },
];

export const brokerSidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/broker/home",
    label: "Home",
  },
  {
    imgURL: "/icons/users.svg",
    route: "/broker/my-clients",
    label: "My Clients",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/broker/client-funding",
    label: "Client Funding Products",
  },
  {
    imgURL: "/icons/headset.svg",
    route: "/broker/support-service",
    label: "Contact Us",
  },
];

export const settingsSidebar = [
  {
    imgURL: "/icons/circle-user-round.svg",
    route: "/settings/personal",
    label: "Personal",
  },
];

export const settingsSidebarAdmin = [
  {
    imgURL: "/icons/circle-user-round.svg",
    route: "/settings/personal",
    label: "Personal",
  },
  // {
  //   imgURL: "/icons/circle-user-round.svg",
  //   route: "/settings/users",
  //   label: "Users",
  // },
  // {
  //   imgURL: "/icons/handshake.svg",
  //   route: "/settings/broker",
  //   label: "Broker Invitations",
  // },
];

export const transactionCategoryStyles = {
  Declined: {
    borderColor: "border-red-700",
    backgroundColor: "bg-red-700",
    textColor: "text-red-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Lender Skipped": {
    borderColor: "border-red-700",
    backgroundColor: "bg-red-700",
    textColor: "text-red-700",
    chipBackgroundColor: "bg-inherit",
  },
  ERROR: {
    borderColor: "border-red-700",
    backgroundColor: "bg-red-700",
    textColor: "text-red-700",
    chipBackgroundColor: "bg-inherit",
  },
  InActive: {
    borderColor: "border-red-700",
    backgroundColor: "bg-red-700",
    textColor: "text-red-700",
    chipBackgroundColor: "bg-inherit",
  },
  Processing: {
    borderColor: "border-amber-500",
    backgroundColor: "bg-amber-500",
    textColor: "text-amber-700",
    chipBackgroundColor: "bg-amber-100",
  },
  Paused: {
    borderColor: "border-amber-500",
    backgroundColor: "bg-amber-500",
    textColor: "text-amber-700",
    chipBackgroundColor: "bg-amber-100",
  },
  Pending: {
    borderColor: "border-amber-500",
    backgroundColor: "bg-amber-500",
    textColor: "text-amber-700",
    chipBackgroundColor: "bg-amber-100",
  },
  "Sent to Lender": {
    borderColor: "border-amber-500",
    backgroundColor: "bg-amber-500",
    textColor: "text-amber-700",
    chipBackgroundColor: "bg-amber-100",
  },
  "Pre-Approved": {
    borderColor: "border-emerald-100",
    backgroundColor: "bg-emerald-400",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  Approved: {
    borderColor: "border-emerald-300",
    backgroundColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  Active: {
    borderColor: "border-emerald-300",
    backgroundColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  Yes: {
    borderColor: "border-emerald-300",
    backgroundColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  Resolved: {
    borderColor: "border-emerald-300",
    backgroundColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  Success: {
    borderColor: "border-emerald-300",
    backgroundColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  SUCCESS: {
    borderColor: "border-emerald-300",
    backgroundColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  Published: {
    borderColor: "border-emerald-300",
    backgroundColor: "bg-emerald-600",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-emerald-50",
  },
  default: {
    borderColor: "",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700",
    chipBackgroundColor: "bg-inherit",
  },
};

export const courseCategories = [
  {
    label: "Personal",
    value: "Personal",
  },
  {
    label: "Business",
    value: "Business",
  },
];

export const US_STATES = [
  {
    label: "Nationwide",
    value: "Nationwide",
  },
  {
    label: "Alabama",
    value: "AL",
  },
  {
    label: "Alaska",
    value: "AK",
  },
  {
    label: "Arizona",
    value: "AZ",
  },
  {
    label: "Arkansas",
    value: "AR",
  },
  {
    label: "California",
    value: "CA",
  },
  {
    label: "Colorado",
    value: "CO",
  },
  {
    label: "Connecticut",
    value: "CT",
  },
  {
    label: "Delaware",
    value: "DE",
  },
  {
    label: "District Of Columbia",
    value: "DC",
  },
  {
    label: "Florida",
    value: "FL",
  },
  {
    label: "Georgia",
    value: "GA",
  },
  {
    label: "Hawaii",
    value: "HI",
  },
  {
    label: "Idaho",
    value: "ID",
  },
  {
    label: "Illinois",
    value: "IL",
  },
  {
    label: "Indiana",
    value: "IN",
  },
  {
    label: "Iowa",
    value: "IA",
  },
  {
    label: "Kansas",
    value: "KS",
  },
  {
    label: "Kentucky",
    value: "KY",
  },
  {
    label: "Louisiana",
    value: "LA",
  },
  {
    label: "Maine",
    value: "ME",
  },
  {
    label: "Maryland",
    value: "MD",
  },
  {
    label: "Massachusetts",
    value: "MA",
  },
  {
    label: "Michigan",
    value: "MI",
  },
  {
    label: "Minnesota",
    value: "MN",
  },
  {
    label: "Mississippi",
    value: "MS",
  },
  {
    label: "Missouri",
    value: "MO",
  },
  {
    label: "Montana",
    value: "MT",
  },
  {
    label: "Nebraska",
    value: "NE",
  },
  {
    label: "Nevada",
    value: "NV",
  },
  {
    label: "New Hampshire",
    value: "NH",
  },
  {
    label: "New Jersey",
    value: "NJ",
  },
  {
    label: "New Mexico",
    value: "NM",
  },
  {
    label: "New York",
    value: "NY",
  },
  {
    label: "North Carolina",
    value: "NC",
  },
  {
    label: "North Dakota",
    value: "ND",
  },
  {
    label: "Ohio",
    value: "OH",
  },
  {
    label: "Oklahoma",
    value: "OK",
  },
  {
    label: "Oregon",
    value: "OR",
  },
  {
    label: "Pennsylvania",
    value: "PA",
  },
  {
    label: "Rhode Island",
    value: "RI",
  },
  {
    label: "South Carolina",
    value: "SC",
  },
  {
    label: "South Dakota",
    value: "SD",
  },
  {
    label: "Tennessee",
    value: "TN",
  },
  {
    label: "Texas",
    value: "TX",
  },
  {
    label: "Utah",
    value: "UT",
  },
  {
    label: "Vermont",
    value: "VT",
  },
  {
    label: "Virginia",
    value: "VA",
  },
  {
    label: "Washington",
    value: "WA",
  },
  {
    label: "West Virginia",
    value: "WV",
  },
  {
    label: "Wisconsin",
    value: "WI",
  },
  {
    label: "Wyoming",
    value: "WY",
  },
];

export const frequencyOfIncome = [
  "Hourly",
  "Weekly",
  "BiWeekly",
  "Monthly",
  "Yearly",
].map((f) => ({
  value: f,
  label: f,
}));

export const howDoYouGetPaid: DropdownOption[] = [
  {
    value: "yes_direct_deposit",
    label: "Yes, I get paid direct deposit.",
    type: "yes",
  },
  {
    value: "yes_checks",
    label: "Yes, I get paid checks.",
    type: "yes",
  },
  {
    value: "yes_cash",
    label: "Yes, I get paid cash.",
    type: "yes",
  },
  {
    value: "no_assistance",
    label: "No, I'm on disability or other government assistance.",
    type: "no",
  },
  {
    value: "no_work",
    label: "No, I don't.",
    type: "no",
  },
];

export const personalTaxes: DropdownOption[] = [
  {
    value: "yes_every_year",
    label: "Yes, I file them every year.",
    type: "yes",
  },
  {
    value: "yes_once",
    label: "Yes, I have filed at some point in my life.",
    type: "yes",
  },
  {
    value: "no",
    label: "No.",
    type: "no",
  },
];

export const businessTaxes: DropdownOption[] = [
  {
    value: "yes_every_year",
    label: "Yes, I file them every year.",
    type: "yes",
  },
  {
    value: "yes_once",
    label: "Yes, I have filed at some point in my life.",
    type: "yes",
  },
  {
    value: "no",
    label: "No.",
    type: "no",
  },
];

// Us citizen
// Permanent resident
// Visa/ other legal status
// Work permit
// Undocumented
export const legalResident: DropdownOption[] = [
  // { value: "Yes, I'm a citizen", label: "Yes, I'm a citizen" },
  // { value: "Yes, I have green card", label: "Yes, I have green card" },
  // {
  //   value: "No, I don't have legal status",
  //   label: "No, I don't have legal status",
  // },
  // { value: "Other", label: "Other" },
  { value: "US Citizen", label: "US Citizen" },
  { value: "Permanent Resident", label: "Permanent Resident" },
  { value: "Visa/ Other Legal Status", label: "Visa/ Other Legal Status" },
  { value: "Work Permit", label: "Work Permit" },
  { value: "Undocumented", label: "Undocumented" },
];
