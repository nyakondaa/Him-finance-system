// src/components/CustomModal.tsx
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomModalProps {
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    showConfirmButton?: boolean;
    title?: string;
    isOpen: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
                                                     message,
                                                     onClose,
                                                     onConfirm,
                                                     showConfirmButton = false,
                                                     title = "Notification",
                                                     isOpen,
                                                 }) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-base">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    {showConfirmButton && (
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onConfirm?.();
                                onClose();
                            }}
                        >
                            Confirm
                        </Button>
                    )}
                    <Button
                        variant={showConfirmButton ? "outline" : "default"}
                        onClick={onClose}
                    >
                        {showConfirmButton ? "Cancel" : "OK"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CustomModal;