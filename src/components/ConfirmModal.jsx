import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

export default function ConfirmModal({
  open,
  title = 'Confirmar',
  description = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm = () => {},
  onCancel = () => {},
  children
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 sm:px-6 pt-4 pb-2 border-b border-gray-700">
              <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white text-sm sm:text-base"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-4">
              {description && <p className="text-sm text-gray-300">{description}</p>}
              {children}
            </div>

            <div className="mt-2 sm:mt-4 px-4 sm:px-6 pb-4 pt-2 border-t border-gray-700 flex justify-end gap-2 sm:gap-3 bg-gray-800/90">
              <button
                onClick={onCancel}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}