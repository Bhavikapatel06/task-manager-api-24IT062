import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isDeleting }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-icon-danger">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="modal-title">{title || 'Confirm Deletion'}</h3>
          </div>
        </div>

        <p className="modal-body">
          {message || 'Are you sure you want to delete this task? This action cannot be undone and will permanently remove the record from MongoDB.'}
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', margin: 0 }}></span>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
