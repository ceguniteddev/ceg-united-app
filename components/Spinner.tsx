import React from "react";

const Spinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-sm text-muted-foreground">Loading data...</p>
    </div>
  );
};

export default Spinner;
