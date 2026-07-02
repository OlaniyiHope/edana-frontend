import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Plus } from "lucide-react";

interface FormShellProps {
  title: string;
  type: "add" | "edit";
  loading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose?: () => void;
  children: React.ReactNode;
} 

export const FormShell = ({
  title,
  type,
  loading,
  onSubmit,
  onClose,
  children,
}: FormShellProps) => {
  const [open, setOpen] = React.useState(true);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-y-auto border-black bg-white p-4 sm:p-6">
        <DialogHeader className="border-b border-black pb-4">
          <DialogTitle className="text-lg font-bold text-primary">
          {type === "add" ? `Add New ${title}` : `Edit ${title}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {type === "add" ? `Create a new ${title.toLowerCase()}.` : `Update the selected ${title.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-black pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full border-black text-black hover:bg-[#004aaa]/10 hover:text-black sm:w-auto" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" loading={loading} className="w-full px-8 bg-primary text-white hover:bg-primary/90 hover:text-white active:bg-primary active:text-white focus-visible:text-white sm:w-auto">
              {type === "add" ? (
                <Plus size={16} className="mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {type === "add" ? "Create" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
