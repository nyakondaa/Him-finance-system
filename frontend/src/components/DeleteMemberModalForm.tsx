import React from 'react';
import { Modal, Button } from '@mui/material';

interface DeleteMemberModalFormProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    memberName?: string;
}

console.log("DeleteMemberModalForm component loaded");

const DeleteMemberModalForm: React.FC<DeleteMemberModalFormProps> = ({
    open,
    onClose,
    onConfirm,
    memberName,
}) => {
    return (
        <Modal open={open} onClose={onClose} aria-labelledby="delete-member-modal-title">
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#fff',
                    padding: 24,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    minWidth: 320,
                }}
            >
                <h2 id="delete-member-modal-title">Delete Member</h2>
                <p>
                    Are you sure you want to delete{' '}
                    <strong>{memberName ? memberName : 'this member'}</strong>?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                    <Button variant="contained" color="inherit" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="error" onClick={onConfirm}>
                        Delete
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteMemberModalForm;