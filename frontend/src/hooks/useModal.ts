// src/hooks/useModal.js
import { useState, useCallback, type SetStateAction } from 'react';

const useModal = () => {
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('Notification');
    const [showConfirmButton, setShowConfirmButton] = useState(false);
    const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null);

    const showModal = useCallback((message: SetStateAction<string>, title = 'Notification', showConfirm = false, onConfirm = null) => {
        setModalMessage(message);
        setModalTitle(title);
        setShowConfirmButton(showConfirm);
        setConfirmAction(() => onConfirm); // Use a function to store the callback
    }, []);

    const closeModal = useCallback(() => {
        setModalMessage('');
        setModalTitle('Notification');
        setShowConfirmButton(false);
        setConfirmAction(null);
    }, []);

    const handleConfirm = useCallback(() => {
        if (confirmAction) {
            confirmAction();
        }
        closeModal();
    }, [confirmAction, closeModal]);

    return {
        modalMessage,
        modalTitle,
        showConfirmButton,
        confirmAction,
        showModal,
        closeModal,
        handleConfirm,
    };
};

export default useModal;
