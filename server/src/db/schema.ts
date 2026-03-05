import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const uuidId = text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID());

export const paymentMethods = sqliteTable("payment_methods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const clients = sqliteTable("clients", {
  id: uuidId,
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  cuit: text("cuit"),
  dni: text("dni"),
  email: text("email"),
  type: text("type").default("FINAL"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  price: real("price").notNull(),
  wholesalePrice: real("wholesale_price"),
  isRefill: integer("is_refill", { mode: "boolean" }).default(false),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  stock: integer("stock").notNull().default(0),
  lastResetAt: integer("last_reset_at", { mode: "timestamp" }),
  trackStock: integer("track_stock", { mode: "boolean" }).default(true),
  dailyResetStock: integer("daily_reset_stock"),
  isReturnable: integer("is_returnable", { mode: "boolean" }).default(false),
});

export const routePricingSchemes = sqliteTable("route_pricing_schemes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  haveDiscount: integer("have_discount", { mode: "boolean" }).default(true),
  discount: integer("discount", { mode: "number" }).default(0),
});

export const routePricingTiers = sqliteTable("route_pricing_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schemeId: integer("scheme_id")
    .references(() => routePricingSchemes.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),

  minVolume: integer("min_volume").notNull(),
  maxVolume: integer("max_volume"),

  renderPrice: real("render_price").notNull(),
});

export const routes = sqliteTable("routes", {
  id: uuidId,
  driverName: text("driver_name").notNull(),
  status: text("status").default("OPEN"),

  pricingSchemeId: integer("pricing_scheme_id")
    .references(() => routePricingSchemes.id)
    .default(1),

  stockStatus: text("stock_status").default("OPEN"),
  paymentStatus: text("payment_status").default("PENDING"),

  date: integer("date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  closedAt: integer("closed_at", { mode: "timestamp" }),

  observations: text("observations"),
});

export const routeItems = sqliteTable("route_items", {
  id: uuidId,
  routeId: text("route_id")
    .references(() => routes.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),

  initialLoad: integer("initial_load").notNull(),
  returnedLoad: integer("returned_load").default(0),

  soldCount: integer("sold_count").default(0),

  creditCount: integer("credit_count").default(0),

  streetPriceSnapshot: real("street_price_snapshot").notNull(),
});

export const cashShifts = sqliteTable("cash_shifts", {
  id: uuidId,
  openedAt: integer("opened_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  initialAmount: real("initial_amount").notNull().default(0),
  finalAmount: real("final_amount"),
  systemAmount: real("system_amount"),
  difference: real("difference"),
  operatorName: text("operator_name"),
  observations: text("observations"),
  status: text("status").default("OPEN"),
});

export const cashMovements = sqliteTable("cash_movements", {
  id: uuidId,
  shiftId: text("shift_id")
    .references(() => cashShifts.id)
    .notNull(),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const users = sqliteTable("users", {
  id: uuidId,
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").default("EMPLOYEE"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const sales = sqliteTable("sales", {
  id: uuidId,
  shiftId: text("shift_id").references(() => cashShifts.id),
  ticketCode: text("ticket_code").unique().notNull(),
  ticketNumber: text("ticket_number").unique(),

  routeId: text("route_id").references(() => routes.id),

  clientId: text("client_id").references(() => clients.id),
  totalAmount: real("total_amount").notNull(),
  paidAmount: real("paid_amount").default(0),
  paymentStatus: text("payment_status").default("UNPAID"),
  paymentMethodId: integer("payment_method_id").references(
    () => paymentMethods.id,
  ),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const saleItems = sqliteTable("sale_items", {
  id: uuidId,
  saleId: text("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const clientPayments = sqliteTable("client_payments", {
  id: uuidId,
  clientId: text("client_id")
    .references(() => clients.id)
    .notNull(),
  shiftId: text("shift_id")
    .references(() => cashShifts.id)
    .notNull(),

  amount: real("amount").notNull(),
  method: text("method").default("CASH"),
  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

export const routesRelations = relations(routes, ({ many }) => ({
  items: many(routeItems),
  sales: many(sales),
}));

export const routeItemsRelations = relations(routeItems, ({ one }) => ({
  route: one(routes, {
    fields: [routeItems.routeId],
    references: [routes.id],
  }),
  product: one(products, {
    fields: [routeItems.productId],
    references: [products.id],
  }),
}));

export const routePricingTiersRelations = relations(
  routePricingTiers,
  ({ one }) => ({
    scheme: one(routePricingSchemes, {
      fields: [routePricingTiers.schemeId],
      references: [routePricingSchemes.id],
    }),
    product: one(products, {
      fields: [routePricingTiers.productId],
      references: [products.id],
    }),
  }),
);

export const routePricingSchemesRelations = relations(
  routePricingSchemes,
  ({ many }) => ({
    tiers: many(routePricingTiers),
  }),
);

export const cashShiftsRelations = relations(cashShifts, ({ many }) => ({
  sales: many(sales),
  movements: many(cashMovements),
  collections: many(clientPayments),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  client: one(clients, {
    fields: [sales.clientId],
    references: [clients.id],
  }),
  shift: one(cashShifts, {
    fields: [sales.shiftId],
    references: [cashShifts.id],
  }),
  route: one(routes, {
    fields: [sales.routeId],
    references: [routes.id],
  }),
  items: many(saleItems),
  paymentMethods: one(paymentMethods, {
    fields: [sales.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const cashMovementsRelations = relations(cashMovements, ({ one }) => ({
  shift: one(cashShifts, {
    fields: [cashMovements.shiftId],
    references: [cashShifts.id],
  }),
}));

export const clientRelations = relations(clients, ({ many }) => ({
  sales: many(sales),
  payments: many(clientPayments),
}));

export const clientPaymentsRelations = relations(clientPayments, ({ one }) => ({
  client: one(clients, {
    fields: [clientPayments.clientId],
    references: [clients.id],
  }),
  shift: one(cashShifts, {
    fields: [clientPayments.shiftId],
    references: [cashShifts.id],
  }),
}));
