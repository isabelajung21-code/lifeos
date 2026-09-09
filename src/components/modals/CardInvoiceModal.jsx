import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  X,
} from "lucide-react";
import { COLORS } from "../../constants/theme";

export default function CardInvoiceModal({
  open,
  onClose,
  card,
  invoice,
  used,
  available,
  dueDate,
  onPayInvoice,
  invoiceOffset,
  onPreviousInvoice,
  onNextInvoice,
  onCurrentInvoice,
  invoiceInfo,
}) {
  if (!open || !card || !invoice) return null;

  function money(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const transactions = [...(invoice.transactions || [])].sort((a, b) =>
    String(a.transaction_date || "").localeCompare(
      String(b.transaction_date || "")
    )
  );

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(25,35,45,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "min(760px, 96vw)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 22px 65px rgba(0,0,0,.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 750,
                color: COLORS.ink,
              }}
            >
              {invoiceInfo?.label || "Fatura"}
            </div>

            <div
              style={{
                fontSize: 11,
                color: COLORS.inkSoft,
                marginTop: 3,
              }}
            >
              {invoice.start.toLocaleDateString("pt-BR")} até{" "}
              {invoice.end.toLocaleDateString("pt-BR")}

              <div
                style={{
                    fontSize: 10,
                    color: COLORS.inkSoft,
                    marginTop: 2,
                }}
                >
                {card.name}

                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        marginTop: 7,
                        padding: "4px 8px",
                        borderRadius: 999,
                        fontSize: 9.5,
                        fontWeight: 700,

                        background:
                        invoiceInfo?.status === "paga"
                            ? COLORS.successLight
                            : invoiceInfo?.status === "fechada"
                            ? COLORS.warningLight
                            : COLORS.primaryLight,

                        color:
                        invoiceInfo?.status === "paga"
                            ? COLORS.success
                            : invoiceInfo?.status === "fechada"
                            ? COLORS.warning
                            : COLORS.primaryDark,
                    }}
                    >
                    {invoiceInfo?.statusLabel || "Aberta"}
                    </div>
                </div>
            </div>
          </div>

          <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 18,
                padding: "9px 10px",
                background: COLORS.bg,
                borderRadius: 10,
            }}
            >
            <button
                type="button"
                onClick={onPreviousInvoice}
                style={{
                width: 32,
                height: 32,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                borderRadius: 8,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                color: COLORS.ink,
                }}
            >
                <ChevronLeft size={16} />
            </button>

            <button
                type="button"
                onClick={onCurrentInvoice}
                style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "center",
                }}
            >
                <div
                style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.ink,
                }}
                >
                {invoiceInfo?.label || "Fatura"}
                </div>

                <div
                style={{
                    fontSize: 9.5,
                    color: COLORS.inkSoft,
                    marginTop: 2,
                }}
                >
                {dueDate
                    ? `Vence em ${dueDate.toLocaleDateString("pt-BR")}`
                    : "Sem vencimento"}
                </div>
            </button>

            <button
                type="button"
                onClick={onNextInvoice}
                style={{
                width: 32,
                height: 32,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.surface,
                borderRadius: 8,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                color: COLORS.ink,
                }}
            >
                <ChevronRight size={16} />
            </button>
            </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              border: "none",
              background: COLORS.bg,
              borderRadius: 9,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              color: COLORS.ink,
            }}
          >
            <X size={17} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <InfoCard
            label="Fatura atual"
            value={money(invoice.total)}
          />

          <InfoCard
            label="Vencimento"
            value={
              dueDate
                ? dueDate.toLocaleDateString("pt-BR")
                : "—"
            }
          />

          <InfoCard
            label="Limite comprometido"
            value={money(used)}
          />

          <InfoCard
            label="Disponível"
            value={
              available == null ? "—" : money(available)
            }
          />
        </div>

        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderBottom: `1px solid ${COLORS.border}`,
              background: COLORS.bg,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.ink,
            }}
          >
            Compras da fatura
          </div>

          {transactions.length === 0 ? (
            <div
              style={{
                padding: 20,
                color: COLORS.inkSoft,
                fontSize: 12,
              }}
            >
              Nenhuma compra nesta fatura.
            </div>
          ) : (
            transactions.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "90px minmax(0, 1fr) 90px 110px",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    color: COLORS.inkSoft,
                  }}
                >
                  {item.transaction_date
                    ? new Date(
                        `${item.transaction_date}T12:00:00`
                      ).toLocaleDateString("pt-BR")
                    : "—"}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 650,
                      color: COLORS.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </div>

                  {item.total_installments > 1 && (
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 9.5,
                        color: COLORS.primaryDark,
                        fontWeight: 600,
                      }}
                    >
                      Parcela {item.installment_number}/
                      {item.total_installments}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.inkSoft,
                  }}
                >
                  {item.status === "previsto"
                    ? "Previsto"
                    : item.status === "pago"
                    ? "Pago"
                    : item.status}
                </div>

                <div
                  style={{
                    textAlign: "right",
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  {money(item.amount)}

                  {Number(item.paidAmount || 0) > 0 &&
                    Number(item.remainingAmount || 0) > 0 && (
                        <div
                        style={{
                            fontSize: 9,
                            color: COLORS.success,
                            marginTop: 2,
                        }}
                        >
                        Antecipado: {money(item.paidAmount)}
                        {" • "}
                        Restante: {money(item.remainingAmount)}
                        </div>
                    )}
                    {Number(item.remainingAmount || 0) <= 0 && (
                        <div
                            style={{
                            fontSize: 9,
                            color: COLORS.success,
                            fontWeight: 650,
                            marginTop: 2,
                            }}
                        >
                            Pago
                        </div>
                        )}
                </div>
              </div>
            ))
          )}
        </div>

        <div
            style={{
                marginTop: 14,
            }}
            >
            <div
                style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 8,
                }}
            >
                <div
                style={{
                    padding: 10,
                    borderRadius: 9,
                    background: COLORS.bg,
                }}
                >
                <div
                    style={{
                    fontSize: 9,
                    color: COLORS.inkSoft,
                    }}
                >
                    Total da fatura
                </div>

                <div
                    style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.ink,
                    marginTop: 3,
                    }}
                >
                    {money(invoice.total)}
                </div>
                </div>

                <div
                style={{
                    padding: 10,
                    borderRadius: 9,
                    background: COLORS.successLight,
                }}
                >
                <div
                    style={{
                    fontSize: 9,
                    color: COLORS.inkSoft,
                    }}
                >
                    Pago / antecipado
                </div>

                <div
                    style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.success,
                    marginTop: 3,
                    }}
                >
                    {money(invoice.paidTotal)}
                </div>
                </div>

                <div
                style={{
                    padding: 10,
                    borderRadius: 9,
                    background:
                    invoice.pendingTotal > 0
                        ? COLORS.warningLight
                        : COLORS.successLight,
                }}
                >
                <div
                    style={{
                    fontSize: 9,
                    color: COLORS.inkSoft,
                    }}
                >
                    Restante
                </div>

                <div
                    style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color:
                        invoice.pendingTotal > 0
                        ? COLORS.warning
                        : COLORS.success,
                    marginTop: 3,
                    }}
                >
                    {money(invoice.pendingTotal)}
                </div>
                </div>
            </div>

            {invoiceInfo?.status === "paga" && (
                <div
                style={{
                    fontSize: 10,
                    color: COLORS.success,
                    fontWeight: 700,
                    marginTop: 8,
                    textAlign: "right",
                }}
                >
                Fatura paga
                </div>
            )}

            {invoice.pendingTotal > 0 &&
                invoiceInfo?.canPay && (
                <div
                    style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 16,
                    }}
                >
                    <button
                    type="button"
                    onClick={() => onPayInvoice?.()}
                    style={{
                        border: "none",
                        background: COLORS.primary,
                        color: "#fff",
                        borderRadius: 9,
                        padding: "10px 15px",
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 650,
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                    }}
                    >
                    <CreditCard size={15} />
                    Pagar fatura
                    </button>
                </div>
                )}
            </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: "11px 12px",
        background: COLORS.surface,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: COLORS.inkSoft,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: COLORS.ink,
          marginTop: 3,
        }}
      >
        {value}
      </div>
    </div>
  );
}