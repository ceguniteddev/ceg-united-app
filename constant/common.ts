export const FIREBASE_TOKEN_NAME = "auth_token";

export const yesNo = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
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
    route: "/overview",
    label: "Home",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/my-funding",
    label: "My Funding",
  },
  {
    imgURL: "/icons/credit-card.svg",
    route: "/my-accounts",
    label: "My Accounts",
  },
  {
    imgURL: "/icons/building-2.svg",
    route: "/my-business",
    label: "My Business",
  },
  // {
  //   imgURL: "/icons/transaction.svg",
  //   route: "/transaction-history",
  //   label: "Transaction History",
  // },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/my-credit",
    label: "My Credit",
  },
  // {
  //   imgURL: "/icons/dollar-circle.svg",
  //   route: "/my-tradelines",
  //   label: "My Tradelines",
  // },
  {
    imgURL: "/icons/files.svg",
    route: "/my-documents",
    label: "My Documents",
  },
  // {
  //   imgURL: "/icons/dollar-circle.svg",
  //   route: "/other-services",
  //   label: "Other Services",
  // },
  // {
  //   imgURL: "/icons/dollar-circle.svg",
  //   route: "/whats-new",
  //   label: "What's New",
  // },
  {
    imgURL: "/icons/headset.svg",
    route: "/support-service",
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
    imgURL: "/icons/credit-card.svg",
    route: "/admin/funding-products",
    label: "Products",
  },
  {
    imgURL: "/icons/landmark.svg",
    route: "/admin/bank-products",
    label: "Bank Products",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/admin/funding-application",
    label: "Funding Applications",
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
  {
    imgURL: "/icons/circle-user-round.svg",
    route: "/settings/users",
    label: "Users",
  },
];

export const transactionCategoryStyles = {
  Declined: {
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
  default: {
    borderColor: "",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700",
    chipBackgroundColor: "bg-inherit",
  },
};

export const US_STATES = [
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
