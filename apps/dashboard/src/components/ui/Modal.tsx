import React from 'react';
import { Modal as NextUIModal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitDisabled?: boolean;
  isLoading?: boolean;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSubmit, 
  submitText = 'Simpan', 
  cancelText = 'Batal', 
  isSubmitDisabled, 
  isLoading 
}: ModalProps) {
  return (
    <NextUIModal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} placement="center" scrollBehavior="inside" size="xl">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              {children}
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose} isDisabled={isLoading}>
                {cancelText}
              </Button>
              {onSubmit && (
                <Button color="primary" onPress={onSubmit} isLoading={isLoading} isDisabled={isSubmitDisabled} className="text-white">
                  {submitText}
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </NextUIModal>
  );
}
