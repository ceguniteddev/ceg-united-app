import Landing from "./landing-page";
const Home = () => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <main className="flex flex-grow w-full h-full justify-center items-start lg:items-center py-6 sm:py-8 lg:py-12">
        <Landing />
      </main>
    </div>
  );
};

export default Home;
