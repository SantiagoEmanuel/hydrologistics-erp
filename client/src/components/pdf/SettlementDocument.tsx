import type { SettlementPreview } from "@/services/route.service";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#374151",
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    backgroundColor: "#2563EB",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: "#BFDBFE",
    fontSize: 10,
    marginTop: 2,
  },
  receiptBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 8,
    borderRadius: 4,
    alignItems: "flex-end",
  },
  receiptText: { color: "#FFFFFF", fontSize: 9 },
  receiptNumber: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },

  body: { padding: 30 },

  infoGrid: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  infoLabel: {
    fontSize: 8,
    color: "#6B7280",
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
    textTransform: "uppercase",
  },
  sectionBadge: {
    backgroundColor: "#E5E7EB",
    color: "#4B5563",
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  table: {
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  colProd: { width: "30%" },
  colNum: { width: "12%", textAlign: "center" },
  colDed: { width: "12%", textAlign: "center", color: "#EA580C" },
  colPrice: { width: "15%", textAlign: "right", color: "#6B7280" },
  colTotal: { width: "19%", textAlign: "right", fontWeight: "bold" },

  deductionRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#FED7AA",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#FFF7ED",
  },
  colDedName: { width: "35%", fontSize: 8, color: "#9A3412" },
  colDedItem: {
    width: "15%",
    textAlign: "center",
    fontSize: 8,
    color: "#9A3412",
  },
  colDedTotal: {
    width: "20%",
    textAlign: "right",
    fontSize: 8,
    fontWeight: "bold",
    color: "#9A3412",
  },

  totalContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
  },
  totalBox: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
    borderWidth: 1,
    borderRadius: 6,
    padding: 15,
    width: 200,
    alignItems: "flex-end",
  },
  totalLabel: { fontSize: 10, color: "#047857", textTransform: "uppercase" },
  totalValue: {
    fontSize: 20,
    color: "#047857",
    fontWeight: "bold",
    marginTop: 2,
  },

  tripContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
  },
  tripHeader: {
    backgroundColor: "#F9FAFB",
    padding: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tripTitle: { fontSize: 9, fontWeight: "bold" },
  tripTime: { fontSize: 9, color: "#6B7280" },
  tripRow: {
    flexDirection: "row",
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  tripColProd: { width: "40%", fontSize: 8 },
  tripColVal: { width: "20%", fontSize: 8, textAlign: "center" },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7,
    color: "#9CA3AF",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  signLine: {
    width: "40%",
    borderTopWidth: 1,
    borderTopColor: "#9CA3AF",
    alignItems: "center",
    paddingTop: 5,
  },
  signText: { fontSize: 8, color: "#6B7280", textTransform: "uppercase" },
});

const formatMoney = (val: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(val);

interface Props {
  data: SettlementPreview;
  receiptNumber?: string;
}

export default function SettlementDocument({
  data,
  receiptNumber = "BORRADOR",
}: Props) {
  const today = new Date().toLocaleDateString("es-AR");

  const itemsWithDeductions = data.summary.filter(
    (item) =>
      item.deductions.boleta > 0 ||
      item.deductions.transfer > 0 ||
      item.deductions.exchange > 0,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.brandTitle}>HYDROLOGISTICS</Text>
            <Text style={styles.brandSubtitle}>
              Informe de Rendición y Cierre
            </Text>
          </View>
          <View style={styles.receiptBox}>
            <Text style={styles.receiptText}>COMPROBANTE</Text>
            <Text style={styles.receiptNumber}>#{receiptNumber}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Responsable</Text>
              <Text style={styles.infoValue}>{data.driverName}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Fecha de Ruta</Text>
              <Text style={styles.infoValue}>
                {data.date.split("-").reverse().join("/")}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Fecha de Emisión</Text>
              <Text style={styles.infoValue}>{today}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Resumen Financiero</Text>
            <Text style={styles.sectionBadge}>Liquidación de Caja</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colProd}>PRODUCTO</Text>
              <Text style={styles.colNum}>TOTAL</Text>
              <Text style={styles.colDed}>DEDUC.</Text>
              <Text style={styles.colNum}>NETO</Text>
              <Text style={styles.colPrice}>PRECIO REF.</Text>
              <Text style={styles.colTotal}>SUBTOTAL</Text>
            </View>

            {data.summary.map((item, idx) => {
              const deductions =
                (item.deductions?.boleta || 0) +
                (item.deductions?.transfer || 0) +
                (item.deductions?.exchange || 0);

              const refPrice =
                item.cashUnits > 0 ? item.finalDebt / item.cashUnits : 0;

              return (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    { backgroundColor: idx % 2 === 0 ? "#FFF" : "#F9FAFB" },
                  ]}
                >
                  <Text style={styles.colProd}>{item.productName}</Text>
                  <Text style={styles.colNum}>{item.totalSold}</Text>
                  <Text style={styles.colDed}>
                    {deductions > 0 ? `-${deductions}` : "-"}
                  </Text>
                  <Text style={[styles.colNum, { fontWeight: "bold" }]}>
                    {item.cashUnits}
                  </Text>
                  <Text style={styles.colPrice}>
                    {refPrice > 0 ? formatMoney(refPrice) : "-"}
                  </Text>
                  <Text style={styles.colTotal}>
                    {formatMoney(item.finalDebt)}
                  </Text>
                </View>
              );
            })}
          </View>

          {itemsWithDeductions.length > 0 && (
            <View style={{ marginBottom: 15 }}>
              <View
                style={[
                  styles.sectionHeader,
                  { borderBottomWidth: 0, marginTop: 5, marginBottom: 5 },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { fontSize: 10, color: "#9A3412" },
                  ]}
                >
                  Desglose de Deducciones y Compensaciones
                </Text>
              </View>

              <View
                style={{
                  borderRadius: 4,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "#FED7AA",
                }}
              >
                <View
                  style={[
                    styles.deductionRow,
                    {
                      backgroundColor: "#FFEDD5",
                      borderBottomWidth: 1,
                      borderBottomColor: "#FDBA74",
                    },
                  ]}
                >
                  <Text style={[styles.colDedName, { fontWeight: "bold" }]}>
                    PRODUCTO
                  </Text>
                  <Text style={[styles.colDedItem, { fontWeight: "bold" }]}>
                    BOLETAS
                  </Text>
                  <Text style={[styles.colDedItem, { fontWeight: "bold" }]}>
                    TRANSF.
                  </Text>
                  <Text style={[styles.colDedItem, { fontWeight: "bold" }]}>
                    CAMBIOS
                  </Text>
                  <Text style={[styles.colDedTotal, { fontWeight: "bold" }]}>
                    COMPENSACIÓN
                  </Text>
                </View>

                {itemsWithDeductions.map((item, idx) => (
                  <View key={idx} style={styles.deductionRow}>
                    <Text style={styles.colDedName}>{item.productName}</Text>
                    <Text style={styles.colDedItem}>
                      {item.deductions.boleta || "-"}
                    </Text>
                    <Text style={styles.colDedItem}>
                      {item.deductions.transfer || "-"}
                    </Text>
                    <Text style={styles.colDedItem}>
                      {item.deductions.exchange || "-"}
                    </Text>
                    <Text style={styles.colDedTotal}>
                      {item.voucherCompensation > 0
                        ? formatMoney(item.voucherCompensation)
                        : "-"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {itemsWithDeductions.length > 0 && (
            <View
              style={{
                marginTop: 0,
                marginBottom: 5,
                padding: 8,
                backgroundColor: "#F3F4F6",
                borderRadius: 4,
              }}
            >
              <Text
                style={{ fontSize: 7, color: "#6B7280", fontStyle: "italic" }}
              >
                * Las Boletas y Transferencias descuentan efectivo a rendir y
                generan una compensación de $410/u a favor del chofer. Los
                Cambios por rotura solo descuentan del total vendido.
              </Text>
            </View>
          )}

          <View style={styles.totalContainer}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Efectivo a Rendir</Text>
              <Text style={styles.totalValue}>
                {formatMoney(data.totalToPay)}
              </Text>
            </View>
          </View>

          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Detalle de Movimientos</Text>
            <Text style={styles.sectionBadge}>
              {data.routesIncluded} Viajes Registrados
            </Text>
          </View>

          {data.routeDetails &&
            data.routeDetails.map((route, idx) => (
              <View key={idx} style={styles.tripContainer}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripTitle}>VIAJE #{idx + 1}</Text>
                  <Text style={styles.tripTime}>
                    Hora Cierre:{" "}
                    {new Date(route.closedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    hs
                  </Text>
                </View>

                <View style={[styles.tripRow, { backgroundColor: "#F3F4F6" }]}>
                  <Text style={styles.tripColProd}>PRODUCTO</Text>
                  <Text style={styles.tripColVal}>CARGA</Text>
                  <Text style={styles.tripColVal}>VOLVIÓ</Text>
                  <Text style={[styles.tripColVal, { fontWeight: "bold" }]}>
                    VENTA
                  </Text>
                </View>

                {route.items.map((item, i) => (
                  <View key={i} style={styles.tripRow}>
                    <Text style={styles.tripColProd}>{item.productName}</Text>
                    <Text style={styles.tripColVal}>{item.initialLoad}</Text>
                    <Text style={styles.tripColVal}>{item.returnedLoad}</Text>
                    <Text style={[styles.tripColVal, { fontWeight: "bold" }]}>
                      {item.soldCount}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

          <View style={styles.signatures}>
            <View style={styles.signLine}>
              <Text style={styles.signText}>Firma Responsable (Admin)</Text>
            </View>
            <View style={styles.signLine}>
              <Text style={styles.signText}>Firma Conforme (Chofer)</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Sistema HydroLogistics - Documento oficial de control interno.
          </Text>
          <Text>
            Este documento respalda el ingreso de efectivo y el movimiento de
            stock detallado.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
