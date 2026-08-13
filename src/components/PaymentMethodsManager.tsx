"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2, 
  Star, 
  ShieldCheck, 
  AlertTriangle,
  Lock,
  AlertCircle
} from "lucide-react";
import { PaymentMethod, CardFormData } from "@/types/payment";
import PaymentMethodModal from "./PaymentMethodModal";

interface PaymentMethodsManagerProps {
  cards: PaymentMethod[];
  onAddCard: (data: CardFormData) => void;
  onUpdateCard: (id: string, data: CardFormData) => void;
  onDeleteCard: (id: string) => void;
  onSetDefaultCard: (id: string) => void;
}

export default function PaymentMethodsManager({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onSetDefaultCard,
}: PaymentMethodsManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentMethod | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: PaymentMethod) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleSaveCard = (data: CardFormData, cardId?: string) => {
    if (cardId) {
      onUpdateCard(cardId, data);
    } else {
      onAddCard(data);
    }
  };

  const handleConfirmDelete = (id: string) => {
    if (cards.length <= 1) return; // Guard clause
    onDeleteCard(id);
    setDeletingCardId(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-slate-900" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Payment Methods
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manage your saved cards. An active subscription requires keeping at least one card on file.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#cc142d] hover:bg-[#b00f24] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Payment Method
        </button>
      </div>

      {/* Required One Card Notice when only 1 card exists */}
      {cards.length === 1 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-3 text-xs text-amber-900 font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You currently have <span className="font-extrabold">1 saved card</span>. Active subscriptions require keeping at least one valid payment method.
          </span>
        </div>
      )}

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const isDeleting = deletingCardId === card.id;
          const isOnlyCard = cards.length <= 1;

          return (
            <div
              key={card.id}
              className={`relative p-5 rounded-2xl border transition-all duration-200 space-y-4 ${
                card.isDefault
                  ? "border-red-200 bg-gradient-to-br from-red-50/30 to-white ring-2 ring-red-100 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
              }`}
            >
              {/* Card Header & Brand */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black uppercase text-xs tracking-wider shadow-sm">
                    {card.brand}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-900 text-base">
                        •••• {card.last4}
                      </span>
                      {card.isDefault && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wide rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-red-600" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Expires {card.expMonth}/{card.expYear}
                    </p>
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(card)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Update Card Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingCardId(card.id)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      isOnlyCard
                        ? "text-slate-300 hover:text-slate-400 hover:bg-slate-50"
                        : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                    }`}
                    title={isOnlyCard ? "Cannot delete only card" : "Delete Card"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cardholder Name & Set Default */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                  Cardholder: <span className="font-bold text-slate-800">{card.holderName}</span>
                </span>

                {!card.isDefault && (
                  <button
                    onClick={() => onSetDefaultCard(card.id)}
                    className="text-red-600 hover:text-red-800 font-bold transition-colors cursor-pointer underline text-[11px]"
                  >
                    Make Default
                  </button>
                )}
              </div>

              {/* Delete Confirmation Box / Guard Prompt */}
              {isDeleting && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-3 z-10 border border-slate-200 shadow-lg">
                  {isOnlyCard ? (
                    <>
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Cannot delete payment method
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                          Active subscriptions require keeping at least one card on file. Please add a new card before deleting this one.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setDeletingCardId(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => {
                            setDeletingCardId(null);
                            handleOpenAdd();
                          }}
                          className="px-3 py-1.5 bg-[#cc142d] hover:bg-[#b00f24] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Add New Card First
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Delete card ending in {card.last4}?
                        </p>
                        {card.isDefault && (
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            Another card will automatically become default.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeletingCardId(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(card.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
          <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-700">No payment methods saved</p>
            <p className="text-xs text-slate-400 mt-0.5">Add a credit or debit card to keep your subscription active.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#cc142d] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            Add Card Now
          </button>
        </div>
      )}

      {/* Security Footer */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> 256-bit SSL encrypted & PCI-DSS compliant
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Powered by Stripe Payments
        </span>
      </div>

      {/* Payment Method Add/Update Modal */}
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCard={editingCard}
        onSaveCard={handleSaveCard}
      />
    </div>
  );
}
