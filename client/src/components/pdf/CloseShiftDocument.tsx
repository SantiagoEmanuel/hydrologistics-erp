import type { Sale } from "@/types/sale.types";
import type { CashMovement } from "@/types/shift.types";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#333" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderColor: "#2563EB",
    paddingBottom: 10,
  },
  titleSection: { flexDirection: "column" },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#111",
  },
  subtitle: { fontSize: 10, color: "#666", marginTop: 2 },

  metaSection: { alignItems: "flex-end" },
  metaText: { fontSize: 9, marginBottom: 2 },

  summaryContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#F9FAFB",
  },
  summaryTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 8, color: "#444" },
  summaryValue: { fontSize: 8, fontWeight: "bold" },

  bigTotal: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 5,
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 5,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 2,
    color: "#2563EB",
  },

  table: { width: "100%", marginBottom: 10 },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderColor: "#999",
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" },

  colTime: { width: "15%" },
  colDesc: { width: "45%" },
  colType: { width: "20%" },
  colAmount: { width: "20%", textAlign: "right" },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 10,
  },
  signatures: {
    flexDirection: "row",
    marginTop: 40,
    justifyContent: "space-around",
  },
  signLine: {
    borderTopWidth: 1,
    borderColor: "#000",
    width: 150,
    alignItems: "center",
    paddingTop: 5,
  },
});

const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(val);

const formatTime = (date: string | Date) =>
  new Date(date).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("es-AR");

export interface ShiftReportData {
  id: string;
  openedAt: string;
  closedAt?: string;
  operatorName: string;
  initialAmount: number;
  finalAmount?: number;
  sales: Sale[];
  movements: CashMovement[];
}

interface Props {
  data: ShiftReportData;
}

export default function CloseShiftDocument({ data }: Props) {
  const activeSales = data.sales.filter((s) => s.paymentStatus === "PAID");

  const totalIn = data.movements
    .filter((m) => m.type === "IN")
    .reduce((acc, m) => acc + m.amount, 0);
  const totalOut = data.movements
    .filter((m) => m.type === "OUT")
    .reduce((acc, m) => acc + m.amount, 0);

  let salesCash = 0;
  let salesTransfer = 0;

  activeSales.forEach((s) => {
    const method = s.paymentMethods?.name?.toUpperCase() || "EFECTIVO";
    if (method.includes("EFECTIVO") || method.includes("CASH")) {
      salesCash += s.totalAmount;
    } else {
      salesTransfer += s.totalAmount;
    }
  });

  const totalSales = salesCash + salesTransfer;

  const theoreticalCash = data.initialAmount + salesCash + totalIn - totalOut;

  const difference =
    data.finalAmount !== undefined ? data.finalAmount - theoreticalCash : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>HYDROLOGISTICS</Text>
            <Text style={styles.subtitle}>Reporte de Cierre de Caja</Text>
          </View>
          <View style={styles.metaSection}>
            {/* CORRECCIÓN: Usamos data.id con seguridad */}
            <Text style={styles.metaText}>Turno ID:</Text>
            <Text style={styles.metaText}>
              Apertura: {formatDate(data.openedAt)} {formatTime(data.openedAt)}
            </Text>
            <Text style={styles.metaText}>
              Cierre:{" "}
              {data.closedAt
                ? `${formatDate(data.closedAt)} ${formatTime(data.closedAt)}`
                : "EN CURSO"}
            </Text>
            <Text
              style={[styles.metaText, { fontWeight: "bold", marginTop: 2 }]}
            >
              Op: {data.operatorName}
            </Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>1. Flujo de Efectivo</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fondo Inicial:</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(data.initialAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>+ Ventas Efectivo:</Text>
              <Text style={[styles.summaryValue, { color: "#059669" }]}>
                {formatMoney(salesCash)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>+ Ingresos Manuales:</Text>
              <Text style={[styles.summaryValue, { color: "#059669" }]}>
                {formatMoney(totalIn)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>- Gastos/Retiros:</Text>
              <Text style={[styles.summaryValue, { color: "#DC2626" }]}>
                {formatMoney(totalOut)}
              </Text>
            </View>

            <Text style={styles.bigTotal}>{formatMoney(theoreticalCash)}</Text>
            <Text style={{ fontSize: 7, textAlign: "right", color: "#666" }}>
              Teórico en Cajón
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>2. Arqueo Físico</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Teórico Sistema:</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(theoreticalCash)}
              </Text>
            </View>

            {data.finalAmount !== undefined ? (
              <>
                <View style={[styles.summaryRow, { marginTop: 5 }]}>
                  <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>
                    Declarado Real:
                  </Text>
                  <Text style={[styles.summaryValue, { fontSize: 10 }]}>
                    {formatMoney(data.finalAmount)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.summaryRow,
                    {
                      marginTop: 10,
                      borderTopWidth: 1,
                      borderColor: "#ccc",
                      paddingTop: 5,
                    },
                  ]}
                >
                  <Text style={styles.summaryLabel}>Diferencia:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        fontSize: 12,
                        color:
                          difference === 0
                            ? "#059669"
                            : difference > 0
                              ? "#2563EB"
                              : "#DC2626",
                      },
                    ]}
                  >
                    {difference > 0 ? "+" : ""}
                    {formatMoney(difference)}
                  </Text>
                </View>
              </>
            ) : (
              <Text
                style={{
                  fontSize: 9,
                  color: "#aaa",
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                Caja aún no cerrada
              </Text>
            )}
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>3. Ventas Totales</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Efectivo:</Text>
              <Text style={styles.summaryValue}>{formatMoney(salesCash)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transfer/Otros:</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(salesTransfer)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryRow,
                {
                  marginTop: 5,
                  borderTopWidth: 1,
                  borderColor: "#ccc",
                  paddingTop: 5,
                },
              ]}
            >
              <Text style={[styles.summaryLabel, { fontWeight: "bold" }]}>
                TOTAL VENTAS:
              </Text>
              <Text style={[styles.summaryValue, { fontSize: 10 }]}>
                {formatMoney(totalSales)}
              </Text>
            </View>
            <Text style={{ fontSize: 7, marginTop: 10, color: "#666" }}>
              Tickets Cobrados: {activeSales.length}
            </Text>
          </View>
        </View>

        {data.movements && data.movements.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>
              Detalle de Movimientos de Caja (Entradas/Salidas)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colTime, { fontWeight: "bold" }]}>
                  Hora
                </Text>
                <Text style={[styles.colType, { fontWeight: "bold" }]}>
                  Tipo
                </Text>
                <Text style={[styles.colDesc, { fontWeight: "bold" }]}>
                  Descripción
                </Text>
                <Text style={[styles.colAmount, { fontWeight: "bold" }]}>
                  Monto
                </Text>
              </View>

              {data.movements.map((mov, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    i % 2 !== 0 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={styles.colTime}>
                    {formatTime(mov?.createdAt)}
                  </Text>

                  <Text
                    style={[
                      styles.colType,
                      {
                        color: mov.type === "IN" ? "#059669" : "#DC2626",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {mov.type === "IN" ? "INGRESO" : "RETIRO/GASTO"}
                  </Text>
                  <Text style={styles.colDesc}>{mov.description}</Text>
                  <Text style={styles.colAmount}>
                    {formatMoney(mov.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={styles.sectionTitle}>
            Detalle de Ventas (Tickets Cerrados)
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colTime, { fontWeight: "bold" }]}>Hora</Text>
              <Text style={[{ width: "15%" }, { fontWeight: "bold" }]}>
                Ticket
              </Text>
              <Text style={[{ width: "35%" }, { fontWeight: "bold" }]}>
                Cliente
              </Text>
              <Text style={[{ width: "35%" }, { fontWeight: "bold" }]}>
                Detalle
              </Text>
              <Text style={[{ width: "20%" }, { fontWeight: "bold" }]}>
                Método
              </Text>
              <Text style={[styles.colAmount, { fontWeight: "bold" }]}>
                Total
              </Text>
            </View>

            {activeSales.map((sale, i) => {
              const method = sale.paymentMethods?.name || "Efectivo";
              return (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    i % 2 !== 0 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={styles.colTime}>
                    {formatTime(sale.createdAt)}
                  </Text>
                  <Text style={{ width: "20%" }}>#{sale.ticketCode}</Text>
                  <Text style={{ width: "35%" }}>
                    {sale.client?.name || "Consumidor Final"}
                  </Text>
                  <Text style={{ width: "35%", flexDirection: "column" }}>
                    {sale.items.map((item) => (
                      <Text key={item.id}>
                        {item.product.name} x {item.quantity}
                      </Text>
                    ))}
                  </Text>
                  <Text style={{ width: "20%" }}>{method}</Text>
                  <Text style={styles.colAmount}>
                    {formatMoney(sale.totalAmount)}
                  </Text>
                </View>
              );
            })}

            {activeSales.length === 0 && (
              <Text
                style={{
                  padding: 10,
                  textAlign: "center",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                No hubo ventas en este turno.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signLine}>
            <Text>Firma Cajero</Text>
          </View>
          <View style={styles.signLine}>
            <Text>Firma Supervisor/Auditor</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Reporte generado el {new Date().toLocaleString()} - Hydrologistics
            System
          </Text>
        </View>
      </Page>
    </Document>
  );
}
