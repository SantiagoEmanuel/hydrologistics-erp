import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Estilos profesionales y limpios
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#333" },

  // Encabezado con Marca
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderColor: "#2563EB",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#111",
  },
  docTitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  metaSection: { alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: "#888", marginBottom: 2 },
  metaValue: { fontSize: 10, fontWeight: "bold" },

  // Cuerpo del Recibo (Quién paga y cuánto)
  body: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: "#F9FAFB",
    borderRadius: 4,
  },

  row: { flexDirection: "row", marginBottom: 10, alignItems: "center" },
  label: {
    width: 100,
    fontSize: 9,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  value: { fontSize: 12, color: "#000", flex: 1 },
  amountValue: { fontSize: 18, fontWeight: "bold", color: "#059669" },

  // Sección de Estado de Cuenta (Vital para fiados)
  accountSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 15,
  },
  accountTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
    color: "#444",
  },

  table: {
    width: "100%",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
  },
  th: {
    flex: 1,
    fontSize: 8,
    color: "#666",
    textAlign: "right",
    fontWeight: "bold",
  },
  tr: { width: "100%", flexDirection: "row", paddingTop: 5 },
  td: { flex: 1, fontSize: 11, textAlign: "right", fontWeight: "bold" },

  // Footer y Firmas
  signatures: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signLine: {
    borderTopWidth: 1,
    borderColor: "#999",
    width: "40%",
    alignItems: "center",
    paddingTop: 5,
  },
  signLabel: { fontSize: 8, color: "#666" },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
  },
});

const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    val,
  );

export interface PaymentReceiptData {
  receiptNumber: string;
  date: string; // ISO String
  clientName: string;
  clientType?: string;
  amount: number;
  method: string; // Efectivo, Transferencia
  previousBalance: number; // Deuda antes del pago
  newBalance: number; // Deuda después del pago
  notes?: string;
}

interface Props {
  data: PaymentReceiptData;
}

export default function ClientPaymentReceipt({ data }: Props) {
  const formattedDate = new Date(data.date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document>
      <Page size="A5" orientation="landscape" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>HYDROLOGISTICS</Text>
            <Text style={styles.docTitle}>Recibo de Cobranza</Text>
          </View>
          <View style={styles.metaSection}>
            <Text style={styles.metaLabel}>RECIBO N°</Text>
            <Text style={styles.metaValue}>{data.receiptNumber}</Text>
            <Text style={styles.metaLabel}>FECHA</Text>
            <Text style={styles.metaValue}>{formattedDate}</Text>
          </View>
        </View>

        {/* DETALLE DEL PAGO */}
        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.label}>Recibí de:</Text>
            <Text style={styles.value}>
              {data.clientName}{" "}
              <Text style={{ fontSize: 9, color: "#666" }}>
                ({data.clientType || "Cliente"})
              </Text>
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>La suma de:</Text>
            <Text style={styles.amountValue}>{formatMoney(data.amount)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Concepto:</Text>
            <Text style={styles.value}>
              Pago a cuenta / Cancelación de deuda
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Medio de Pago:</Text>
            <Text style={styles.value}>{data.method}</Text>
          </View>

          {data.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Notas:</Text>
              <Text style={{ fontSize: 9, fontStyle: "italic" }}>
                {data.notes}
              </Text>
            </View>
          )}
        </View>

        {/* ESTADO DE CUENTA (EL CORAZÓN DEL FIADO) */}
        <View style={styles.accountSection}>
          <Text style={styles.accountTitle}>Estado de Cuenta Corriente</Text>

          <View style={styles.table}>
            <Text style={styles.th}>Saldo Anterior</Text>
            <Text style={styles.th}>Este Pago (-)</Text>
            <Text style={styles.th}>Saldo Restante</Text>
          </View>

          <View style={styles.tr}>
            <Text style={[styles.td, { color: "#EF4444" }]}>
              {formatMoney(data.previousBalance)}
            </Text>
            <Text style={[styles.td, { color: "#059669" }]}>
              {formatMoney(data.amount)}
            </Text>
            <Text
              style={[
                styles.td,
                {
                  color: data.newBalance > 0 ? "#EF4444" : "#059669",
                  fontSize: 13,
                },
              ]}
            >
              {formatMoney(data.newBalance)}
            </Text>
          </View>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatures}>
          <View style={styles.signLine}>
            <Text style={styles.signLabel}>
              Recibí Conforme (Firma y Sello)
            </Text>
          </View>
          <View style={styles.signLine}>
            <Text style={styles.signLabel}>Firma Cliente</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>
            Comprobante generado por Sistema Hydrologistics - Válido como
            constancia de pago.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
