import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { DateTime } from "luxon";

interface SchemeBreakdownItem {
  productId: number;
  productName: string;
  totalSold: number;
  deductions: { boleta: number; transfer: number; exchange: number };
  cashUnits: number;
  basePrice: number;
  bonuses: number;
  voucherCompensation: number;
  finalDebt: number;
}

interface SchemeSummary {
  schemeId: number;
  schemeName: string;
  haveDiscount: boolean;
  discountValue: number;
  totalToPayForScheme: number;
  items: SchemeBreakdownItem[];
  routesIncluded: string[];
}

interface RouteDetail {
  id: string;
  closedAt: string;
  items: {
    productName: string;
    initialLoad: number;
    returnedLoad: number;
    soldCount: number;
  }[];
}

interface SettlementData {
  driverName: string;
  date: string;
  globalStatus?: {
    paymentStatus: "PAID" | "PENDING";
    stockStatus: "CLOSED" | "OPEN";
  };
  totalRoutes: number;
  totalToPay: number;
  schemesBreakdown: SchemeSummary[];
  routeDetails: RouteDetail[];
}

interface Props {
  data: SettlementData;
}

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
    color: "#059669",
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
    textTransform: "uppercase",
  },

  table: { width: "100%", marginBottom: 15 },

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

  // Columnas Esquemas
  colProd: { width: "30%" },
  colNum: { width: "10%", textAlign: "center" },
  colMoney: { width: "13%", textAlign: "right" },
  colFinal: { width: "14%", textAlign: "right", fontWeight: "bold" },

  // Columnas Auditoría
  colTripId: { width: "25%" },
  colTripProd: { width: "30%" },
  colTripNum: { width: "15%", textAlign: "center" },

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

const formatTime = (date: string) =>
  DateTime.fromISO(date).toLocaleString(DateTime.TIME_SIMPLE);

const formatDate = (date: string) =>
  DateTime.fromISO(date).toFormat("dd/MM/yyyy");

export default function SettlementDocument({ data }: Props) {
  if (!data) return null;

  const isPaid = data.globalStatus?.paymentStatus === "PAID";
  const isStockClosed = data.globalStatus?.stockStatus === "CLOSED";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>HYDROLOGISTICS</Text>
            <Text style={styles.subtitle}>
              Comprobante de Rendición de Rutas
            </Text>
          </View>
          <View style={styles.metaSection}>
            <Text style={styles.metaText}>Fecha: {formatDate(data.date)}</Text>
            <Text style={styles.metaText}>
              Viajes Liquidados: {data.totalRoutes}
            </Text>
            <Text
              style={[
                styles.metaText,
                { fontWeight: "bold", marginTop: 2, color: "#2563EB" },
              ]}
            >
              Chofer: {data.driverName.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>1. Datos del Cierre</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chofer:</Text>
              <Text style={styles.summaryValue}>
                {data.driverName.toUpperCase()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fecha Operativa:</Text>
              <Text style={styles.summaryValue}>{formatDate(data.date)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rutas Incluidas:</Text>
              <Text style={styles.summaryValue}>{data.totalRoutes}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Esquemas Aplic.:</Text>
              <Text style={styles.summaryValue}>
                {data.schemesBreakdown.length}
              </Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>2. Estado del Sistema</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estado Financiero:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: isPaid ? "#059669" : "#DC2626" },
                ]}
              >
                {isPaid ? "PAGADO (CAJA)" : "PENDIENTE"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estado de Stock:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: isStockClosed ? "#059669" : "#DC2626" },
                ]}
              >
                {isStockClosed ? "CERRADO" : "PENDIENTE"}
              </Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>3. Total a Rendir</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Efectivo Neto:</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(data.totalToPay)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Deducciones:</Text>
              <Text style={styles.summaryValue}>Aplicadas por producto</Text>
            </View>

            <Text style={styles.bigTotal}>{formatMoney(data.totalToPay)}</Text>
            <Text style={{ fontSize: 7, textAlign: "right", color: "#666" }}>
              Total Físico Requerido
            </Text>
          </View>
        </View>

        {data.schemesBreakdown.map((scheme, sIdx) => (
          <View key={sIdx} wrap={false}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <Text style={styles.sectionTitle}>
                Esquema: {scheme.schemeName}{" "}
                {scheme.haveDiscount ? "(CON DESCUENTO)" : ""}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  marginBottom: 8,
                  color: "#111",
                }}
              >
                Subtotal: {formatMoney(scheme.totalToPayForScheme)}
              </Text>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colProd, { fontWeight: "bold" }]}>
                  Producto
                </Text>
                <Text style={[styles.colNum, { fontWeight: "bold" }]}>
                  Total
                </Text>
                <Text
                  style={[
                    styles.colNum,
                    { fontWeight: "bold", color: "#DC2626" },
                  ]}
                >
                  Deduc.
                </Text>
                <Text style={[styles.colNum, { fontWeight: "bold" }]}>
                  Cash
                </Text>
                <Text
                  style={[
                    styles.colMoney,
                    { fontWeight: "bold", color: "#2563EB" },
                  ]}
                >
                  Bonif.
                </Text>
                <Text
                  style={[
                    styles.colMoney,
                    { fontWeight: "bold", color: "#9333EA" },
                  ]}
                >
                  Compens.
                </Text>
                <Text style={[styles.colFinal, { fontWeight: "bold" }]}>
                  Subtotal
                </Text>
              </View>

              {scheme.items.map((item, iIdx) => {
                const totalDeductions =
                  item.deductions.boleta +
                  item.deductions.transfer +
                  item.deductions.exchange;
                return (
                  <View
                    key={iIdx}
                    style={[
                      styles.tableRow,
                      iIdx % 2 !== 0 ? styles.tableRowAlt : {},
                    ]}
                  >
                    <View style={styles.colProd}>
                      <Text style={{ fontWeight: "bold" }}>
                        {item.productName}
                      </Text>
                      <Text style={{ fontSize: 7, color: "#666" }}>
                        Base: {formatMoney(item.basePrice)}
                      </Text>
                    </View>
                    <Text style={styles.colNum}>{item.totalSold}</Text>
                    <Text
                      style={[
                        styles.colNum,
                        { color: "#DC2626", fontWeight: "bold" },
                      ]}
                    >
                      {totalDeductions > 0 ? `-${totalDeductions}` : "-"}
                    </Text>
                    <Text style={[styles.colNum, { fontWeight: "bold" }]}>
                      {item.cashUnits}
                    </Text>
                    <Text style={[styles.colMoney, { color: "#2563EB" }]}>
                      {item.bonuses > 0 ? `-${formatMoney(item.bonuses)}` : "-"}
                    </Text>
                    <Text style={[styles.colMoney, { color: "#9333EA" }]}>
                      {item.voucherCompensation > 0
                        ? `-${formatMoney(item.voucherCompensation)}`
                        : "-"}
                    </Text>
                    <Text style={styles.colFinal}>
                      {formatMoney(item.finalDebt)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {data.routeDetails && data.routeDetails.length > 0 && (
          <View wrap={false} style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>
              Detalle y Auditoría de Viajes
            </Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colTripId, { fontWeight: "bold" }]}>
                  Viaje / Cierre
                </Text>
                <Text style={[styles.colTripProd, { fontWeight: "bold" }]}>
                  Producto
                </Text>
                <Text style={[styles.colTripNum, { fontWeight: "bold" }]}>
                  Cargó
                </Text>
                <Text style={[styles.colTripNum, { fontWeight: "bold" }]}>
                  Devolvió
                </Text>
                <Text
                  style={[
                    styles.colTripNum,
                    { fontWeight: "bold", color: "#059669" },
                  ]}
                >
                  Vendió
                </Text>
              </View>

              {data.routeDetails.map((route, rIdx) => (
                <View
                  key={rIdx}
                  style={{
                    borderBottomWidth: 1,
                    borderColor: "#ccc",
                    paddingBottom: 5,
                    marginBottom: 5,
                  }}
                >
                  {route.items.map((item, iIdx) => (
                    <View
                      key={iIdx}
                      style={[
                        styles.tableRow,
                        iIdx % 2 !== 0 ? styles.tableRowAlt : {},
                        { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.colTripId}>
                        {iIdx === 0 ? (
                          <>
                            <Text style={{ fontWeight: "bold", fontSize: 8 }}>
                              ID: {route.id.split("-")[0]}
                            </Text>
                            <Text style={{ fontSize: 7, color: "#666" }}>
                              {formatTime(route.closedAt)}
                            </Text>
                          </>
                        ) : null}
                      </View>
                      <Text
                        style={[styles.colTripProd, { fontWeight: "bold" }]}
                      >
                        {item.productName}
                      </Text>
                      <Text style={styles.colTripNum}>{item.initialLoad}</Text>
                      <Text style={styles.colTripNum}>{item.returnedLoad}</Text>
                      <Text
                        style={[
                          styles.colTripNum,
                          { fontWeight: "bold", color: "#059669" },
                        ]}
                      >
                        {item.soldCount}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.signatures} wrap={false}>
          <View style={styles.signLine}>
            <Text>Firma Chofer ({data.driverName})</Text>
          </View>
          <View style={styles.signLine}>
            <Text>Firma Supervisor/Auditor</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Reporte válido como comprobante de rendición generado el {DateTime.now().toFormat("dd/MM/yyyy HH:mm")} hs
            - Hydrologistics System
          </Text>
        </View>
      </Page>
    </Document>
  );
}
