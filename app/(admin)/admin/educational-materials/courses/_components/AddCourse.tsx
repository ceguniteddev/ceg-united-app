"use client";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import React from "react";
import CourseCreatePage from "../../form";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

const AddCourse = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={``}
        description=""
        className="w-full sm:w-11/12 max-w-4xl max-h-[90vh]"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <CourseCreatePage setOpen={setOpen} />
        </div>
      </ResponsiveDialog>

      <Button
        variant={"outline"}
        className="bg-blue-200 hover:bg-blue-300 cursor-pointer w-full sm:w-auto h-10 sm:h-9"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="h-4 w-4" />
        Add Course
      </Button>
    </div>
  );
};

export default AddCourse;
