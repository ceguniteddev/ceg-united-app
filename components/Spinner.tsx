import React from "react";

const Spinner = ({ displayText = "Loading data..." }: { displayText?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
      {displayText && <p className="text-sm text-muted-foreground">{displayText}</p>}
    </div>
  );
};

export default Spinner;
