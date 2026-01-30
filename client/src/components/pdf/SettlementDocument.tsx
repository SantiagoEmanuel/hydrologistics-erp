import type { SettlementPreview } from "@/services/route.service";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Estilos mejorados para mayor densidad de información
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#222" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    borderBottomWidth: 2,
    borderColor: "#2563EB", // Azul institucional
    paddingBottom: 10,
  },
  brandSection: { flexDirection: "column" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#111",
  },
  subtitle: { fontSize: 10, color: "#666", marginTop: 2 },

  metaSection: { alignItems: "flex-end" },
  metaText: { fontSize: 9, marginBottom: 2 },

  // Info Block
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  infoItem: { flexDirection: "column" },
  infoLabel: {
    fontSize: 8,
    color: "#666",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  infoValue: { fontSize: 11, fontWeight: "bold", marginTop: 2 },

  // Headers de Sección
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 4,
    marginTop: 10,
  },

  // Tablas
  table: { width: "100%", marginBottom: 15 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderColor: "#999",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRowAlt: { backgroundColor: "#F9FAFB" }, // Zebra striping

  // Columnas Genéricas
  colText: { fontSize: 8 },
  colNum: { fontSize: 8, textAlign: "right" },

  // Totales
  totalSection: {
    marginTop: 10,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 10,
  },
  totalRow: { flexDirection: "row", marginBottom: 5, alignItems: "center" },
  totalLabel: { width: 120, textAlign: "right", marginRight: 10, fontSize: 10 },
  totalValue: {
    width: 100,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 12,
  },
  grandTotal: { fontSize: 16, color: "#059669" }, // Verde oscuro

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7,
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

interface Props {
  data: SettlementPreview;
  receiptNumber?: string;
}

export default function SettlementDocument({
  data,
  receiptNumber = "BORRADOR",
}: Props) {
  const today = new Date().toLocaleDateString("es-AR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <Text style={styles.title}>HYDROLOGISTICS</Text>
            <Text style={styles.subtitle}>Comprobante de Rendición</Text>
          </View>
          <View style={styles.metaSection}>
            <Text style={styles.metaText}>Fecha: {today}</Text>
            <Text style={styles.metaText}>Comp. #: {receiptNumber}</Text>
          </View>
        </View>

        {/* INFO PRINCIPAL */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Chofer Responsable</Text>
            <Text style={styles.infoValue}>{data.driverName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha Rendida</Text>
            <Text style={styles.infoValue}>{data.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Viajes</Text>
            <Text style={styles.infoValue}>{data.routesIncluded}</Text>
          </View>
        </View>

        {/* 1. TABLA RESUMEN FINANCIERO */}
        <Text style={styles.sectionTitle}>1. Liquidación Financiera</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colText, { width: "30%" }]}>Producto</Text>
            <Text style={[styles.colNum, { width: "10%" }]}>Efvo.</Text>
            <Text style={[styles.colNum, { width: "10%" }]}>Fiado</Text>
            <Text style={[styles.colNum, { width: "15%", color: "#2563EB" }]}>
              Bonif. Vol.
            </Text>
            <Text style={[styles.colNum, { width: "15%", color: "#9333EA" }]}>
              Gan. Boletas
            </Text>
            <Text style={[styles.colNum, { width: "20%" }]}>Subtotal</Text>
          </View>

          {/* Rows */}
          {data.summary.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.colText, { width: "30%" }]}>
                {item.productName}
              </Text>
              <Text style={[styles.colNum, { width: "10%" }]}>
                {item.cashUnits}
              </Text>
              <Text style={[styles.colNum, { width: "10%", color: "#D97706" }]}>
                {item.credits > 0 ? item.credits : "-"}
              </Text>
              <Text style={[styles.colNum, { width: "15%", color: "#2563EB" }]}>
                {item.bonuses > 0 ? `-${formatMoney(item.bonuses)}` : "-"}
              </Text>
              {/* AQUÍ ESTÁ EL CAMBIO CLAVE: MOSTRAR LA COMPENSACIÓN */}
              <Text style={[styles.colNum, { width: "15%", color: "#9333EA" }]}>
                {item.voucherCompensation && item.voucherCompensation > 0
                  ? `-${formatMoney(item.voucherCompensation)}`
                  : "-"}
              </Text>
              <Text
                style={[styles.colNum, { width: "20%", fontWeight: "bold" }]}
              >
                {formatMoney(item.finalDebt)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALES */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { fontSize: 14 }]}>
              TOTAL A ENTREGAR:
            </Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {formatMoney(data.totalToPay)}
            </Text>
          </View>
        </View>

        {/* 2. TABLA DETALLE DE VIAJES (AUDITORÍA) */}
        {/* Asumiendo que agregaste routeDetails a la interfaz SettlementPreview */}
        {data.routeDetails && data.routeDetails.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              2. Auditoría de Carga por Viaje
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colText, { width: "15%" }]}>
                  Hora Cierre
                </Text>
                <Text style={[styles.colText, { width: "35%" }]}>Producto</Text>
                <Text style={[styles.colNum, { width: "15%" }]}>
                  Carga Inic.
                </Text>
                <Text style={[styles.colNum, { width: "15%" }]}>
                  Devolución
                </Text>
                <Text style={[styles.colNum, { width: "20%" }]}>
                  Venta Neta
                </Text>
              </View>

              {data.routeDetails.map((route, rIdx) =>
                route.items.map((item, iIdx) => (
                  <View
                    key={`${rIdx}-${iIdx}`}
                    style={[
                      styles.tableRow,
                      (rIdx + iIdx) % 2 !== 0 ? styles.tableRowAlt : {},
                    ]}
                  >
                    {/* Solo mostramos la hora en la primera fila del grupo del viaje */}
                    <Text style={[styles.colText, { width: "15%" }]}>
                      {iIdx === 0
                        ? new Date(route.closedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </Text>
                    <Text style={[styles.colText, { width: "35%" }]}>
                      {item.productName}
                    </Text>
                    <Text style={[styles.colNum, { width: "15%" }]}>
                      {item.initialLoad}
                    </Text>
                    <Text style={[styles.colNum, { width: "15%" }]}>
                      {item.returnedLoad}
                    </Text>
                    <Text
                      style={[
                        styles.colNum,
                        { width: "20%", fontWeight: "bold" },
                      ]}
                    >
                      {item.soldCount}{" "}
                      {item.creditCount > 0
                        ? `(${item.creditCount} fiado)`
                        : ""}
                    </Text>
                  </View>
                )),
              )}
            </View>
          </>
        )}

        {/* FIRMAS */}
        <View style={styles.signatures}>
          <View style={styles.signLine}>
            <Text>Firma Responsable</Text>
          </View>
          <View style={styles.signLine}>
            <Text>Firma Chofer</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>Documento generado electrónicamente por Hydrologistics.</Text>
          <Text>
            El presente sirve como constancia de rendición de valores y stock.
          </Text>
          <Text>{new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  );
}
