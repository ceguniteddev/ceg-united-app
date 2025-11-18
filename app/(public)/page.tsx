import Landing from "./landing-page";
const Home = () => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <main className="flex flex-grow w-full h-full justify-center items-center py-4 sm:py-8">
        <Landing />
      </main>
    </div>
  );
};

export default Home;
