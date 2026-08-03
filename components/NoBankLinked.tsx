import React from "react";

const NoBankLinked = () => {
  return (
    <div className="flex-center min-h-[50vh] w-full px-4">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-chart p-8 text-center">
        <h1 className="text-24 font-semibold">No accounts found</h1>
        <p className="mt-2 text-muted-foreground">
          Bank account linking is currently unavailable.
        </p>
      </div>
    </div>
  );
};

export default NoBankLinked;
