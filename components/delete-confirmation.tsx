import React from "react";
import { Button } from "./ui/button";
import { CircleXIcon, Loader2Icon, Trash2Icon } from "lucide-react";

type Props = {
  handleDelete: () => void;
  isDeleting: boolean;
  info: string;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DeleteConfirmation = ({ handleDelete, info, isDeleting, setModalOpen }: Props) => {
  return (
    <div>
      <span>
        Are you sure you want to delete
        <br />
        <b>{info}</b>?
      </span>
      <div className="flex space-x-6 mt-10">
        <Button
          variant="outline"
          className=""
          type="button"
          disabled={isDeleting}
          onClick={() => setModalOpen(false)}
        >
          <CircleXIcon className="h-4 w-4" />
          Close
        </Button>
        <Button
          type="button"
          className="bg-red-400 hover:bg-red-500"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2Icon className="h-4 w-4" /> Delete
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
