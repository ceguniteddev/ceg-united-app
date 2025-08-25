const EnvironmentBanner = () => {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;

  let environmentDisplay = "";
  let bannerClass = "";

  if (environment === "development") {
    environmentDisplay = "DEVELOPMENT";
    bannerClass = "bg-red-500 text-white font-bold text-center py-2 text-lg";
  } else if (environment === "staging") {
    environmentDisplay = "STAGING";
    bannerClass = "bg-yellow-500 text-black font-bold text-center py-2 text-lg";
  }

  return environmentDisplay ? (
    <div className={`w-full ${bannerClass}`}>{environmentDisplay}</div>
  ) : (
    ""
  );
};

export default EnvironmentBanner;
