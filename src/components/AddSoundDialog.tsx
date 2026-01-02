import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface AddSoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (sound: { title: string; duration: number; hotkey: string }) => void;
}

export const AddSoundDialog: React.FC<AddSoundDialogProps> = ({ open, onOpenChange, onAdd }) => {
  const [title, setTitle] = React.useState('');
  const [hotkey, setHotkey] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please enter a sound name");
      return;
    }
    
    // Simulate duration between 2 and 15 seconds
    const duration = Math.floor(Math.random() * 13) + 2; 
    
    onAdd({ title, duration, hotkey });
    toast.success(`Added "${title}" to soundboard`);
    
    // Reset
    setTitle('');
    setHotkey('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Sound</DialogTitle>
          <DialogDescription>
            Add a new sound effect to your board. Files are stored locally.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Airhorn"
              className="col-span-3"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hotkey" className="text-right">
              Hotkey
            </Label>
            <Input
              id="hotkey"
              value={hotkey}
              onChange={(e) => setHotkey(e.target.value.slice(0, 1).toUpperCase())}
              placeholder="e.g. A"
              className="col-span-3"
              maxLength={1}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label className="text-right">File</Label>
             <div className="col-span-3 text-sm text-muted-foreground italic border border-dashed rounded px-3 py-2">
                Drag & drop audio file here (Simulated)
             </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Sound</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
